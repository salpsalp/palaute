/* eslint-disable no-continue */
const { Op, QueryTypes } = require('sequelize')
const Sentry = require('@sentry/node')
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
} = require('../../models')
const { WORKLOAD_QUESTION_ID } = require('../../util/config')
const { sequelize } = require('../../db/dbConnection')
const { sumSummaryDatas, mapOptionIdToValue } = require('./summaryUtils')

let rootOrganisations = []
const getRootOrganisations = async () => {
  const rootOrgs = await Organisation.findAll({
    attributes: ['id'],
    where: {
      parentId: null,
    },
  })
  return rootOrgs.map(org => org.id)
}

let relevantQuestionIds = null
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
  questionIds.push(WORKLOAD_QUESTION_ID)

  return new Set(questionIds)
}

const buildSummariesForPeriod = async (startDate, endDate) => {
  // ---------------- Phase 1: ------------------
  // Build course realisation, course unit and organisation summaries from feedbacks for courses during this time period

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
        include: {
          model: Organisation,
          as: 'organisations',
          attributes: ['id', 'parentId'],
        },
      },
      {
        model: CourseUnit,
        attributes: ['id', 'groupId'],
        as: 'courseUnit',
        required: true,
        include: {
          model: Organisation,
          as: 'organisations',
          attributes: ['id', 'parentId'],
        },
      },
      {
        model: UserFeedbackTarget,
        attributes: ['id'],
        as: 'userFeedbackTargets',
        where: {
          accessStatus: 'STUDENT',
        },
        required: true,
        include: {
          model: Feedback,
          attributes: ['data', 'createdAt'],
          as: 'feedback',
        },
      },
    ],
    // limit: 100,
    // logging: true,
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

    // We mark the end date of this data to be at the time the last feedback was given.
    // This is more accurate compared to CUR end date, which can sometimes be set arbitrarily far into the future by the teacher
    // If no feedback was given, use the start date.
    /*const endDate = fbt.feedbackCount
      ? _.max(fbt.userFeedbackTargets.filter(ufbt => ufbt.feedback).map(ufbt => ufbt.feedback.createdAt))
      : fbt.courseRealisation.startDate*/

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
      curOrganisations: fbt.courseRealisation.organisations.map(org => _.pick(org, ['id', 'parentId'])),
      cuOrganisations: fbt.courseUnit.organisations.map(org => _.pick(org, ['id', 'parentId'])),
    })
  } // CURs are now done and we could write CUR summaries to db. But we leave db operations to the end.

  // Make the initial CU summaries.
  const courseUnitSummaries = Object.entries(_.groupBy(courseRealisationSummaries, cur => cur.courseUnitId)).map(
    ([cuId, courseRealisations]) => ({
      entityId: cuId,
      courseRealisations: _.uniqBy(courseRealisations, 'entityId'),
    })
  )

  // Sum them up from CURs. Then we're done with CUs and could write CU summaries to db.
  for (const cu of courseUnitSummaries) {
    const { courseRealisations } = cu
    delete cu.courseRealisations // Now not needed anymore

    cu.data = sumSummaryDatas(courseRealisations.map(cur => cur.data))
  }

  // Very cool. Now make the initial CU group summaries, just like we did for CUs, but using groupId instead of id.
  const courseUnitGroupSummaries = Object.entries(
    _.groupBy(courseRealisationSummaries, cur => cur.courseUnitGroupId)
  ).map(([cuGroupId, courseRealisations]) => ({
    entityId: cuGroupId,
    courseRealisations: _.uniqBy(courseRealisations, 'entityId'),
  }))

  // Sum them up from CURs. Then we're done with CU groups and could write CU group summaries to db.
  for (const cuGroup of courseUnitGroupSummaries) {
    const { courseRealisations } = cuGroup
    delete cuGroup.courseRealisations // Now not needed anymore

    cuGroup.data = sumSummaryDatas(courseRealisations.map(cur => cur.data))
  }

  // Make the initial org summaries. These are the orgs that are responsible for some courses.
  const orgSummaries = _.uniqBy(
    courseRealisationSummaries.flatMap(cur => [...cur.cuOrganisations, ...cur.curOrganisations]),
    'id'
  ).map(org => ({
    entityId: org.id,
    parentId: org.parentId,
    parent: null,
    courseRealisations: _.uniqBy(
      courseRealisationSummaries.filter(
        cur => cur.curOrganisations.some(o => o.id === org.id) || cur.cuOrganisations.some(o => o.id === org.id)
      ),
      'entityId'
    ),
  }))

  // ---------------- Phase 2: ------------------
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

  // Now we can actually calculate the org summaries from each org's CURs
  for (const org of orgSummaries) {
    org.data = sumSummaryDatas(org.courseRealisations.map(cur => cur.data))
    delete org.courseRealisations
    delete org.parent
  }

  const relevantFields = ['entityId', 'data']
  const allSummaries = courseRealisationSummaries
    .concat(courseUnitSummaries)
    .concat(courseUnitGroupSummaries)
    .concat(orgSummaries)
    .filter(summary => summary.data && summary.data.feedbackCount > 0)
    .map(summary => _.pick(summary, relevantFields))
    .map(summary => ({ ...summary, startDate, endDate }))

  // Make sure no duplicates
  const uniqueSummaries = _.uniqBy(allSummaries, 'entityId')
  if (uniqueSummaries.length !== allSummaries.length) {
    // Warning, duplicates found. Find and report duplicates.
    const duplicates = _.differenceBy(allSummaries, uniqueSummaries, ({ entityId }) => entityId)
    Sentry.setExtra('duplicates', duplicates)
    Sentry.captureMessage(`Duplicate summaries found for ${duplicates.length} entities.`)
  }

  // Write all summaries to db.
  await Summary.bulkCreate(uniqueSummaries)
}

const startYear = 2020 // Nothing ending before this is considered
const endYear = new Date().getFullYear() // Nothing ending after this is considered

const datePeriods = (() => {
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
  // Initialize root organisations and relevant question ids
  rootOrganisations = await getRootOrganisations()
  relevantQuestionIds = await getRelevantQuestionIds()

  // Delete all summaries
  await sequelize.query(`DELETE FROM summaries;`)

  // Build summaries for each time period
  for (const { start, end } of datePeriods) {
    console.time(`${start.toISOString()}-${end.toISOString()}`)
    await buildSummariesForPeriod(start, end)
    console.timeEnd(`${start.toISOString()}-${end.toISOString()}`)
  }
}

module.exports = {
  buildSummaries,
}
