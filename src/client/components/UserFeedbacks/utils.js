import groupBy from 'lodash/groupBy'

import feedbackTargetIsOpen from '../../util/feedbackTargetIsOpen'
import feedbackTargetIsEnded from '../../util/feedbackTargetIsEnded'

export const courseRealisationIsMisisingFeedback = (courseRealisation) => {
  if (!Array.isArray(courseRealisation.feedbackTargets)) {
    return false
  }

  const missing = courseRealisation.feedbackTargets.find(
    ({ feedback }) => !feedback,
  )

  return Boolean(missing)
}

const courseRealisationSortFn = (a, b) =>
  new Date(b.endDate) - new Date(a.endDate)

export const sortCourseRealisations = (courseRealisations) => {
  const copy = courseRealisations ? [...courseRealisations] : []

  copy.sort(courseRealisationSortFn)

  return copy
}

export const getDeletePath = (userFeedbackTarget) => {
  const feedbackId = userFeedbackTarget?.feedback?.id

  return feedbackId ? `/feedbacks/${feedbackId}` : null
}

export const getCourseRealisationsWithFeedbackTargets = (feedbackTargets) => {
  if (!feedbackTargets) {
    return []
  }

  const courseRealisationById = new Map()

  feedbackTargets.forEach((target) => {
    const { courseRealisation } = target

    courseRealisationById.set(courseRealisation.id, courseRealisation)
  })

  const targetsByCourseRealisationId = groupBy(
    feedbackTargets,
    (target) => target.courseRealisation.id,
  )

  return Object.entries(targetsByCourseRealisationId).map(
    ([courseRealisationId, targets]) => ({
      ...courseRealisationById.get(courseRealisationId),
      feedbackTargets: targets,
    }),
  )
}

export const filterFeedbackTargetsByStatus = (feedbackTargets, status) => {
  if (!feedbackTargets) {
    return []
  }
  const acualFeedbackTargets = feedbackTargets.filter(
    (target) => new Date(2020, 11, 0) < new Date(target.opensAt),
  )
  if (status === 'waitingForFeedback') {
    return acualFeedbackTargets.filter(
      (feedbackTarget) =>
        !feedbackTargetIsEnded(feedbackTarget) && !feedbackTarget.feedback,
    )
  }

  if (status === 'feedbackGiven') {
    return acualFeedbackTargets.filter(
      (feedbackTarget) => feedbackTarget.feedback,
    )
  }

  if (status === 'feedbackClosed') {
    return acualFeedbackTargets.filter((target) =>
      feedbackTargetIsEnded(target),
    )
  }

  return acualFeedbackTargets
}
