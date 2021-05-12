import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableHead,
  Card,
  makeStyles,
  TableBody,
} from '@material-ui/core'

import { getLanguageValue } from '../../util/languageUtils'

import {
  getQuestionsWithFeedback,
  countAverage,
  countStandardDeviation,
  countMedian,
} from './utils'

const useStyles = makeStyles({
  container: {
    marginBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
})

const FeedbackSummary = ({
  publicQuestionIds,
  questions,
  feedbacks,
  isTeacher,
}) => {
  const classes = useStyles()
  const { i18n, t } = useTranslation()

  const questionsWithFeedbacks = useMemo(
    () => getQuestionsWithFeedback(questions, feedbacks, publicQuestionIds),
    [questions, feedbacks, publicQuestionIds],
  )

  const summaryQuestions = questionsWithFeedbacks.filter(
    (q) =>
      q.type === 'LIKERT' && (isTeacher || publicQuestionIds.includes(q.id)),
  )

  return (
    <TableContainer component={Card} className={classes.container}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>{t('feedbackSummary:question')}</TableCell>
            <TableCell>{t('feedbackSummary:average')}</TableCell>
            <TableCell>{t('feedbackSummary:standardDeviation')}</TableCell>
            <TableCell>{t('feedbackSummary:median')}</TableCell>
            <TableCell>{t('feedbackSummary:answers')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {summaryQuestions.map((question) => (
            <TableRow key={question.id}>
              <TableCell>
                {getLanguageValue(question.data.label, i18n.language)}
              </TableCell>
              <TableCell>{countAverage(question.feedbacks)}</TableCell>
              <TableCell>
                {countStandardDeviation(question.feedbacks)}
              </TableCell>
              <TableCell>{countMedian(question.feedbacks)}</TableCell>
              <TableCell>{question.feedbacks.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default FeedbackSummary
