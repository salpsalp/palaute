import groupBy from 'lodash/groupBy'
import countBy from 'lodash/countBy'
import flatMap from 'lodash/flatMap'

import theme from '../../theme'

import { getLanguageValue } from '../../util/languageUtils'

const INCLUDED_TYPES = ['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'LIKERT', 'OPEN']

const getScalesConfig = (t) => ({
  y: {
    title: {
      display: true,
      text: t('questionResults:answerCount'),
    },
    ticks: {
      precision: 0,
    },
  },
  x: {
    title: {
      display: true,
      text: t('questionResults:answerOption'),
    },
  },
})

export const getLikertChartConfig = (question, language, t) => {
  const labels = [...Array(6)].map((v, i) => i.toString())

  const countByLabel = countBy(question.feedbacks, ({ data }) => data ?? '_')
  const datasetLabel = getLanguageValue(question.data?.label, language)
  const data = labels.map((l) => countByLabel[l] ?? 0)

  return {
    options: {
      scales: getScalesConfig(t),
    },
    data: {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data,
          backgroundColor: theme.palette.primary.main,
        },
      ],
    },
  }
}

export const getMultipleChoiceChartConfig = (question, language, t) => {
  const arrayOptions = question.data?.options ?? []

  const labels = arrayOptions.map(({ label }) =>
    getLanguageValue(label, language),
  )

  const datasetLabel = getLanguageValue(question.data?.label, language)
  const flatFeedbacks = flatMap(question.feedbacks, ({ data }) => data ?? [])
  const countByOptionId = countBy(flatFeedbacks, (option) => option)
  const data = arrayOptions.map(({ id }) => countByOptionId[id] ?? 0)

  return {
    options: {
      scales: getScalesConfig(t),
    },
    data: {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data,
          backgroundColor: theme.palette.primary.main,
        },
      ],
    },
  }
}

export const getSingleChoiceChartConfig = (question, language, t) => {
  const arrayOptions = question.data?.options ?? []

  const labels = arrayOptions.map(({ label }) =>
    getLanguageValue(label, language),
  )

  const datasetLabel = getLanguageValue(question.data?.label, language)
  const countByOptionId = countBy(question.feedbacks, ({ data }) => data ?? '_')
  const data = arrayOptions.map(({ id }) => countByOptionId[id] ?? 0)

  return {
    options: {
      scales: getScalesConfig(t),
    },
    data: {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data,
          backgroundColor: theme.palette.primary.main,
        },
      ],
    },
  }
}

export const getQuestionsWithFeedback = (questions, feedbacks) => {
  if (!questions) {
    return []
  }

  const feedbacksArray = feedbacks ?? []

  const feedbackData = feedbacksArray.reduce(
    (acc, feedback) => [
      ...acc,
      ...(Array.isArray(feedback.data) ? feedback.data : []),
    ],
    [],
  )

  const feedbackDataByQuestionId = groupBy(
    feedbackData,
    ({ questionId }) => questionId ?? '_',
  )

  return questions
    .filter((q) => INCLUDED_TYPES.includes(q.type))
    .map((q) => ({
      ...q,
      feedbacks: feedbackDataByQuestionId[q.id] ?? [],
    }))
}
