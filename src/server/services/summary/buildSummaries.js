/* eslint-disable no-continue */
const { Op, QueryTypes } = require('sequelize')
const datefns = require('date-fns')
const _ = require('lodash')
const {
  Feedback,
  UserFeedbackTarget,
  FeedbackTarget,
  CourseRealisation,
  CourseUnit,
  Organisation,
  Summary,
  Tag,
  CourseUnitsOrganisation,
  CourseRealisationsOrganisation,
} = require('../../models')
const { WORKLOAD_QUESTION_ID, OPEN_UNIVERSITY_ORG_ID } = require('../../util/config')
const { sequelize } = require('../../db/dbConnection')
const { sumSummaryDatas, mapOptionIdToValue } = require('./utils')
const logger = require('../../util/logger')
const { prefixTagId } = require('../../util/common')

const getRootOrganisations = async () => {
  const rootOrgs = await Organisation.findAll({
    attributes: ['id'],
    where: {
      parentId: null,
    },
  })
  return rootOrgs.map(org => org.id)
}

const getRelevantQuestionIds = async () => {
  const [questions] = await sequelize.query(
    `
    SELECT q.id
    FROM surveys s
    INNER JOIN questions q ON q.id = ANY (s.question_ids)
    WHERE (s.type = 'university' OR s.type = 'programme')
    AND q.type = 'LIKERT' OR q.id = :workloadQuestionId;
  `,
    { queryType: QueryTypes.SELECT, replacements: { workloadQuestionId: WORKLOAD_QUESTION_ID } }
  )

  const questionIds = questions.map(q => q.id)

  return new Set(questionIds)
}

/**
 * Finds out the extraOrgIds that are responsible for this CUR
 */
const getCurExtraOrgIds = (courseUnitOrganisationIds, courseRealisationOrganisationIds, extraOrgIds) =>
  extraOrgIds.filter(
    orgId => courseUnitOrganisationIds.includes(orgId) || courseRealisationOrganisationIds.includes(orgId)
  )

/**
 * Yields the 1 or 2 variants of this entity, based on extraOrgId.
 * If for example extraOrgId === OPEN_UNI_ORG_ID, one variant would have open uni curs and the other non-open uni curs.
 * If curs of entity are one or another, only one entity would be yielded.
 */
const getExtraOrgVariants = (entity, extraOrgId) =>
  _.partition(entity.courseRealisations, cur => cur.extraOrgIds.includes(extraOrgId))
    .filter(curs => curs.length > 0)
    .map(curs => ({
      ..._.clone(entity),
      courseRealisations: curs,
    }))

const buildSummariesForPeriod = async ({
  startDate,
  endDate,
  rootOrganisations,
  relevantQuestionIds,
  transaction,
  separateOrgId,
}) => {
  // ---------------- Phase 1: ------------------
  // Build summary entities from feedbacks for courses during this time period
  // We do this for the following entities, from "bottom up":
  // 1. course realisations (built from feedback data)
  // 2. course units (built from CURs)
  // 3. course unit groups (--||--)
  // 4. tags (--||--)
  // 5. organisations
  //
  // This should be quite extensible should we want to add more different entities in the future.
  // Since the initial version, I've already added cu groups and tags.

  // Get all the feedback data and associated entities for this period. Then the rest is done JS side.
  const feedbackTargets = await FeedbackTarget.findAll({
    where: {
      // Only consider feedback targets that have feedback.
      feedbackCount: {
        [Op.gt]: 0,
      },
      userCreated: false, // Custom feedbacks may cause issues and dont contribute to stats anyways.
    },
    include: [
      {
        model: CourseRealisation,
        attributes: ['id', 'startDate', 'endDate'],
        as: 'courseRealisation',
        required: true,
        // separate: true,
        where: {
          [Op.or]: [
            // Any overlap with the period
            {
              // Case: CUR starts during the period
              startDate: {
                [Op.between]: [startDate, endDate],
              },
            },
            {
              // Case: CUR ends during the period
              endDate: {
                [Op.between]: [startDate, endDate],
              },
            },
            {
              // Case: CUR starts before and ends after the period
              [Op.and]: [
                {
                  startDate: {
                    [Op.lte]: startDate,
                  },
                },
                {
                  endDate: {
                    [Op.gte]: endDate,
                  },
                },
              ],
            },
          ],
        },
        include: [
          {
            model: CourseRealisationsOrganisation,
            as: 'courseRealisationsOrganisations',
            // attributes: ['organisationId'], // Weird Sequelize thing #1, see below for more...
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id'],
          },
        ],
      },
      {
        model: CourseUnit,
        attributes: ['id', 'groupId'],
        as: 'courseUnit',
        required: true,
        // separate: true,
        include: [
          {
            model: CourseUnitsOrganisation,
            as: 'courseUnitsOrganisations',
            attributes: ['organisationId'],
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id'],
          },
        ],
      },
      {
        model: UserFeedbackTarget,
        attributes: ['id'],
        as: 'userFeedbackTargets',
        where: {
          accessStatus: 'STUDENT',
        },
        required: true,
        separate: true,
        include: {
          model: Feedback,
          attributes: ['data', 'createdAt'],
          as: 'feedback',
        },
      },
    ],
    transaction,
  })

  // Start summing the stuff for course realisations
  const courseRealisationSummaries = []

  for (const fbt of feedbackTargets) {
    // Ignore those that have no students
    // eslint-disable-next-line no-continue
    if (!fbt.userFeedbackTargets.length > 0) continue

    const result = {}

    // Go through each feedback of fbt
    for (const ufbt of fbt.userFeedbackTargets) {
      if (ufbt.feedback) {
        for (const { data, questionId } of ufbt.feedback.data) {
          // Only consider LIKERT & WORKLOAD questions
          if (relevantQuestionIds.has(questionId)) {
            // Initialise question data
            if (!result[questionId]) {
              result[questionId] = {
                mean: 0,
                distribution: {},
              }
            }

            // data is the option id, 0-5 for likert and ids for single choice (WORKLOAD)
            result[questionId].distribution[data] = (result[questionId].distribution[data] ?? 0) + 1
          }
        }
      }
    }

    // Compute the mean (which we've initialised to 0) for each question.
    // Keep in mind that value of 0 for LIKERT means NO ANSWER, its not counted to mean.
    // WORKLOAD has no such option, are values are actual values.
    const questionIds = Object.keys(result)
    for (const questionId of questionIds) {
      const optionIds = Object.keys(result[questionId].distribution)
      let totalCount = 0
      let sum = 0
      for (const optionId of optionIds) {
        if (Number(optionId) !== 0) {
          // skip the NO ANSWER option
          const count = Number(result[questionId].distribution[optionId])
          totalCount += count
          sum += mapOptionIdToValue(optionId, questionId) * count
        }
      }
      result[questionId].mean = totalCount > 0 ? sum / totalCount : 0
    }

    const curOrgIds = fbt.courseRealisation.courseRealisationsOrganisations.map(curo => curo.dataValues.organisationI) // (implementation detail): Weird Sequelize thing #1, organisationId doesn't load in attributes: ['organisationId'] but in dataValues is truncated to 'organisationI'
    const cuOrgIds = fbt.courseUnit.courseUnitsOrganisations.map(cuo => cuo.organisationId)

    courseRealisationSummaries.push({
      entityId: fbt.courseRealisation.id,
      data: {
        result,
        studentCount: fbt.userFeedbackTargets.length,
        hiddenCount: fbt.hiddenCount,
        feedbackCount: fbt.feedbackCount,
        feedbackResponsePercentage: Number(fbt.feedbackResponseEmailSent),
      },
      courseUnitId: fbt.courseUnit.id,
      courseUnitGroupId: fbt.courseUnit.groupId,
      curOrgIds,
      cuOrgIds,
      curTags: fbt.courseRealisation.tags,
      cuTags: fbt.courseUnit.tags,
      extraOrgIds: getCurExtraOrgIds(curOrgIds, cuOrgIds, [separateOrgId]),
    })
  } // CURs are now done and we could write CUR summaries to db. But we leave db operations to the end.

  // Make the initial CU summaries.
  const courseUnitSummaries = Object.entries(_.groupBy(courseRealisationSummaries, cur => cur.courseUnitId))
    .map(([cuId, courseRealisations]) => ({
      entityId: cuId,
      courseRealisations: _.uniqBy(courseRealisations, 'entityId'),
    }))
    .flatMap(cu => getExtraOrgVariants(cu, separateOrgId))

  // Sum them up from CURs. Then we're done with CUs and could write CU summaries to db.
  for (const cu of courseUnitSummaries) {
    const { courseRealisations } = cu
    delete cu.courseRealisations // Now not needed anymore

    cu.data = sumSummaryDatas(courseRealisations.map(cur => cur.data))
    cu.extraOrgIds = _.uniq(courseRealisations.flatMap(cur => cur.extraOrgIds))
  }

  // Very cool. Now make the initial CU group summaries, just like we did for CUs, but using groupId instead of id.
  const courseUnitGroupSummaries = Object.entries(_.groupBy(courseRealisationSummaries, cur => cur.courseUnitGroupId))
    .map(([cuGroupId, courseRealisations]) => ({
      entityId: cuGroupId,
      courseRealisations: _.uniqBy(courseRealisations, 'entityId'),
    }))
    .flatMap(cuGroup => getExtraOrgVariants(cuGroup, separateOrgId))

  // Sum them up from CURs. Then we're done with CU groups and could write CU group summaries to db.
  for (const cuGroup of courseUnitGroupSummaries) {
    const { courseRealisations } = cuGroup
    delete cuGroup.courseRealisations // Now not needed anymore

    cuGroup.data = sumSummaryDatas(courseRealisations.map(cur => cur.data))
    cuGroup.extraOrgIds = _.uniq(courseRealisations.flatMap(cur => cur.extraOrgIds))
  }

  // Make the initial tag summaries. Tags have course realisations directly, and through course unit association.
  const tagSummaries = _.uniqBy(
    courseRealisationSummaries.flatMap(cur => [...cur.curTags, ...cur.cuTags]),
    'id'
  )
    .map(tag => ({
      entityId: prefixTagId(tag.id),
      courseRealisations: _.uniqBy(
        courseRealisationSummaries.filter(
          cur => cur.curTags.some(t => t.id === tag.id) || cur.cuTags.some(t => t.id === tag.id)
        ),
        'entityId'
      ),
    }))
    .flatMap(tag => getExtraOrgVariants(tag, separateOrgId))

  // Sum them up from CURs. Then we're done with tags and could write tag summaries to db.
  for (const tag of tagSummaries) {
    const { courseRealisations } = tag
    delete tag.courseRealisations // Now not needed anymore

    tag.data = sumSummaryDatas(courseRealisations.map(cur => cur.data))
    tag.extraOrgIds = _.uniq(courseRealisations.flatMap(cur => cur.extraOrgIds))
  }

  // Make the initial org summaries. These are the orgs that are responsible for some courses.
  const orgIds = _.uniq(courseRealisationSummaries.flatMap(cur => [...cur.cuOrgIds, ...cur.curOrgIds]))
  const orgs = await Organisation.findAll({ attributes: ['id', 'parentId'], where: { id: orgIds } })
  const orgSummaries = orgs.map(org => ({
    entityId: org.id,
    parentId: org.parentId,
    parent: null,
    courseRealisations: _.uniqBy(
      courseRealisationSummaries.filter(cur => cur.curOrgIds.includes(org.id) || cur.cuOrgIds.includes(org.id)),
      'entityId'
    ),
  }))

  // ---------------- Phase 2 (organisations): ------------------
  // Now we're done with the base layer, CURs, CUs and their direct responsible organisations,
  // and can start the generalising step where we
  // 1. iteratively find parent organisations of all found organisations.
  // 2. populate their CURs that their child organisations are responsible for. (Above we already populated their directly responsible courses)
  // 3. sum up the CUR datas to create final summaries.

  let maxIterations = 10 // Assume that the organisation structure is no deeper than this. Seems safe, HY gets 2 iterations at most.

  do {
    // Find parent from list for each organisation. Also find parent org ids that are not in the list
    const orgsMissingParentOrgs = []
    orgSummaries.forEach(org => {
      if (org.parent) return // Parent already found for this...
      org.parent = orgSummaries.find(o => o.entityId === org.parentId)
      if (!org.parent) orgsMissingParentOrgs.push(org) // Parent not in the list. We need to get its parent from db...
    })

    // eslint-disable-next-line no-loop-func
    if (orgsMissingParentOrgs.every(org => rootOrganisations.includes(org.entityId))) {
      break // Done! Only root organisations left and they got no parents.
    }

    // Find the missing parents...
    const newParentOrgs = await Organisation.findAll({
      attributes: ['id', 'parentId'],
      where: {
        id: {
          [Op.in]: orgsMissingParentOrgs.map(o => o.parentId),
        },
      },
      transaction,
    })

    // And add them to the list. Next iteration their children will be joined to them.
    newParentOrgs.forEach(org => {
      orgSummaries.push({
        entityId: org.id,
        parentId: org.parentId,
        parent: null,
        courseRealisations: [],
      })
    })
  } while (maxIterations-- > 0)

  // The org tree structure is now built.
  // We next need to populate the CURs of parent orgs from bottom orgs that have CURs directly under them.
  // To do this, start from leaf orgs: they are not a parent to any org. Then recursively go up from them until a root node is reached.

  /**
   * Add CURs of organisation's parent from organisation, and then do the same for parent, recursively
   */
  const populateParentsCURs = organisation => {
    const { parent } = organisation
    if (!parent) return // organisation is a root
    parent.courseRealisations = _.uniqBy(parent.courseRealisations.concat(organisation.courseRealisations), 'entityId')
    populateParentsCURs(parent)
  }

  for (const organisation of orgSummaries) {
    // is it a leaf?
    if (!orgSummaries.some(org => org.parentId === organisation.entityId)) {
      // Its a leaf. Now start adding its CURs to its parent recursively.
      populateParentsCURs(organisation)
    }
  }

  const orgSummariesWithVariants = orgSummaries.flatMap(org => getExtraOrgVariants(org, separateOrgId))

  // Now we can actually calculate the org summaries from each org's CURs
  for (const org of orgSummariesWithVariants) {
    org.data = sumSummaryDatas(org.courseRealisations.map(cur => cur.data))
    org.extraOrgIds = _.uniq(org.courseRealisations.flatMap(cur => cur.extraOrgIds))
    delete org.courseRealisations
    delete org.parent
  }

  const relevantFields = ['entityId', 'data', 'extraOrgIds']
  const allSummaries = courseRealisationSummaries
    .concat(courseUnitSummaries)
    .concat(courseUnitGroupSummaries)
    .concat(tagSummaries)
    .concat(orgSummariesWithVariants)
    .filter(summary => summary.data && summary.data.feedbackCount > 0)
    .map(summary => _.pick(summary, relevantFields))
    .map(summary => ({ ...summary, startDate, endDate }))

  // Write all summaries to db.
  await Summary.bulkCreate(allSummaries, {
    transaction,
  })
}

const summariesHaveToBeFullyRebuilt = async () => {
  // If there are no summaries, they have to be built.
  // Also if there are summaries but they date back to more than 1 year, we should rebuild everything
  const latestSummary = await Summary.findOne({
    order: [['startDate', 'DESC']],
  })
  if (!latestSummary) {
    return true
  }

  const diff = datefns.differenceInYears(new Date(), new Date(latestSummary.endDate))
  if (diff > 0) {
    return true
  }
  return false
}

/**
 * Build summaries for all organisations, CUs and CURs.
 * Summary rows will be created for each time period.
 *
 * Possible time periods are:
 * All semesters starting from some defined year.
 * All academic years starting from some defined year.
 *
 * This means that there will be possibly multiple summary rows for each organisation, CU and CURs,
 * depending on from how many periods they have data from.
 *
 * For example, if organisation has CURs from between 2021S and 2023S, there will be
 * Semesters 2021S, 2022K, 2022S, 2023K, 2023S, and...
 * Academic years 2021, 2022, 2023.
 * (in total 8)
 *
 * These represent all the different possible time period "views" the user can select in a summary view to see.
 *
 * If one would want to see periods of two years, summaries for 2021+2022 and 2023+2024 would have to be constructed in addition.
 */
const buildSummaries = async () => {
  let datePeriods = (() => {
    const startYear = 2020 // Nothing ending before this is considered
    const endYear = new Date().getFullYear() // Nothing ending after this is considered

    const dates = []
    for (let year = startYear; year <= endYear; year++) {
      const startOfSpringSemester = new Date(`${year}-01-01`)
      const startOfAutumnSemester = new Date(`${year}-08-01`)
      const startOfNextSpringSemester = new Date(`${year + 1}-01-01`)
      const endOfAcademicYear = new Date(`${year + 1}-07-31`)

      dates.push({
        // kevät
        start: startOfSpringSemester,
        end: datefns.subDays(startOfAutumnSemester, 1),
      })
      dates.push({
        // syys
        start: startOfAutumnSemester,
        end: datefns.subDays(startOfNextSpringSemester, 1),
      })
      dates.push({
        // full academic year
        start: startOfAutumnSemester,
        end: endOfAcademicYear,
      })
    }
    return dates
  })()

  if (!(await summariesHaveToBeFullyRebuilt())) {
    // Only rebuild summaries for the "current" time periods. Those are the ones that end in the future.
    const now = new Date()
    datePeriods = datePeriods.filter(({ end }) => end > now)
    logger.info(`Rebuilding summaries for ${datePeriods.length} time periods.`)
  } else {
    logger.info(`Rebuilding summaries fully.`)
  }

  // Initialize root organisations and relevant question ids
  const rootOrganisations = await getRootOrganisations()
  const relevantQuestionIds = await getRelevantQuestionIds()

  // Build summaries for each time period
  for (const { start, end } of datePeriods) {
    // console.time(`${start.toISOString()}-${end.toISOString()}`)

    await sequelize.transaction(async transaction => {
      // Delete old summaries for this period. Remember that summary dates are exact, we dont want to delete anything "in between".
      await Summary.destroy({
        where: {
          startDate: start,
          endDate: end,
        },
        transaction,
      })

      await buildSummariesForPeriod({
        startDate: start,
        endDate: end,
        rootOrganisations,
        relevantQuestionIds,
        transaction,
        separateOrgId: OPEN_UNIVERSITY_ORG_ID,
      })
    })

    // console.timeEnd(`${start.toISOString()}-${end.toISOString()}`)
  }
}

module.exports = {
  buildSummaries,
}
