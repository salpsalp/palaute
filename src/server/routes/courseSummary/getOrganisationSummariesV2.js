const { subMonths } = require('date-fns')
const _ = require('lodash')
const { sequelize } = require('../../util/dbConnection')
const { ORGANISATION_SUMMARY_QUERY } = require('./sql')
const { getMean } = require('./utils')

// This file name is temporary until all functions from getOrganisationSummaries are replaced

const getOrganisationSummaries = async ({
  questions,
  organisationAccess,
  accessibleCourseRealisationIds,
  includeOpenUniCourseUnits = true,
  startDate = subMonths(new Date(), 24),
  endDate = new Date(),
}) => {
  console.time('getOrganisationSummaries')
  console.time('query')
  // org ids user has org access to
  const organisationIds = organisationAccess.map((org) => org.organisation.id)

  // rows for each CU with its associated CURs in json
  const rows = await sequelize.query(ORGANISATION_SUMMARY_QUERY, {
    replacements: {
      organisationIds: organisationIds.length === 0 ? [''] : organisationIds, // do this for sql reasons
      courseRealisationIds:
        accessibleCourseRealisationIds.length === 0
          ? ['']
          : accessibleCourseRealisationIds,
      startDate,
      endDate,
      includeOpenUniCourseUnits,
    },
    type: sequelize.QueryTypes.SELECT,
  })
  console.timeEnd('query')
  console.time('aggregate CUs')

  const initialResults = questions.map((q) => ({
    questionId: q.id,
    mean: 0,
    distribution: {},
  })) // results object template, array with objects for each questions distribution and mean

  // aggregate CU stats from CUR rows. Also find info about the current (latest) feedback target
  const summedCourseUnits = rows.map((cu) => {
    const results = JSON.parse(JSON.stringify(initialResults))
    let feedbackCount = 0
    let studentCount = 0
    // current info
    let currentFeedbackTargetId = null
    let closesAt = null
    let feedbackResponseGiven = false
    // used for finding the latest fbt with the most feedbacks
    let currentRank = -1

    // sum all CURs
    cu.courseRealisations.forEach((cur) => {
      // iterate over each question
      results.forEach((questionResult) => {
        const { questionId } = questionResult
        const indexOfQuestion = cur.questionIds.indexOf(questionId)

        // sum the distributions
        if (
          indexOfQuestion !== -1 &&
          typeof cur.distribution[indexOfQuestion] === 'object'
        )
          Object.entries(cur.distribution[indexOfQuestion]).forEach(
            ([option, count]) => {
              questionResult.distribution[option] =
                Number(count) + (questionResult.distribution[option] || 0)
            },
          )
      })

      // check if this is more likely the latest fbt
      const rank = Date.parse(cur.startDate) * 10_000 + cur.feedbackCount
      if (rank > currentRank) {
        currentFeedbackTargetId = cur.feedbackTargetId
        closesAt = cur.closesAt
        feedbackResponseGiven = cur.feedbackResponseGiven
        currentRank = rank
      }

      feedbackCount += Number(cur.feedbackCount)
      studentCount += Number(cur.studentCount)
    }, initialResults)

    // compute mean for each question
    results.forEach((questionResult) => {
      questionResult.mean = getMean(
        questionResult.distribution,
        questions.find((q) => q.id === questionResult.questionId),
      )
    })

    return {
      organisationId: cu.organisationId,
      organisationName: cu.organisationName,
      organisationCode: cu.organisationCode,
      courseCode: cu.courseCode,
      name: cu.courseUnitName,
      feedbackCount,
      studentCount,
      results,
      currentFeedbackTargetId,
      closesAt,
      feedbackResponseGiven,
      questionIds: cu.courseRealisations[0].questionIds,
    }
  })
  console.timeEnd('aggregate CUs')
  console.time('aggregate orgs')

  // object with keys as org ids and values as arrays of CUs
  const organisations = _.groupBy(summedCourseUnits, (cu) => cu.organisationId)

  // aggregate org stats from CUs
  const summedOrganisations = Object.entries(organisations).map(
    ([organisationId, courseUnits]) => {
      const results = JSON.parse(JSON.stringify(initialResults))
      let feedbackCount = 0
      let studentCount = 0

      // sum all CUs
      courseUnits.forEach((cu) => {
        // iterate over each question
        results.forEach((questionResult) => {
          const { questionId } = questionResult
          const indexOfQuestion = cu.questionIds.indexOf(questionId)

          // sum the distributions
          if (cu.results[indexOfQuestion])
            Object.entries(cu.results[indexOfQuestion].distribution).forEach(
              ([option, count]) => {
                questionResult.distribution[option] =
                  Number(count) + (questionResult.distribution[option] || 0)
              },
            )
        })

        feedbackCount += Number(cu.feedbackCount)
        studentCount += Number(cu.studentCount)
      }, initialResults)

      // compute mean for each question
      results.forEach((questionResult) => {
        questionResult.mean = getMean(
          questionResult.distribution,
          questions.find((q) => q.id === questionResult.questionId),
        )
      })

      // compute the percentage of CUs whose latest CUR has feedback response given
      const feedbackResponsePercentage =
        _.sumBy(courseUnits, (cu) => (cu.feedbackResponseGiven ? 1 : 0)) /
        courseUnits.length

      return {
        name: courseUnits[0].organisationName,
        id: organisationId,
        code: courseUnits[0].organisationCode,
        feedbackCount,
        studentCount,
        results,
        feedbackResponsePercentage,
        courseUnits: _.orderBy(courseUnits, 'courseCode'),
      }
    },
  )
  console.timeEnd('aggregate orgs')

  console.timeEnd('getOrganisationSummaries')

  return _.orderBy(summedOrganisations, 'code')
}

module.exports = {
  getOrganisationSummaries,
}
