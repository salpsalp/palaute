import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { clearError } from '../util/redux/errorReducer'
import { getLanguageValue } from '../util/languageUtils'

import MultiChoiceQuestion from './MultiChoiceQuestion'
import TextAreaQuestion from './TextAreaQuestion'

const mapTypeToComponent = {
  CHOICE: MultiChoiceQuestion,
  TEXT: TextAreaQuestion,
}

const Question = ({ question, answer, handleFormUpdate }) => {
  const dispatch = useDispatch()
  const error = useSelector((state) => state.error[question.id])
  const { t, i18n } = useTranslation()

  const handleChange = (event) => {
    event.preventDefault()
    handleFormUpdate(question.id, event.target.value)
    if (error) {
      dispatch(clearError(question.id))
    }
  }

  const errorText = () => {
    if (!error) return null
    return t('feedbackForm:requiredErrorText')
  }

  const Component = mapTypeToComponent[question.type]

  return (
    <Component
      question={getLanguageValue(question.question, i18n.language)}
      answer={answer}
      handleChange={handleChange}
      error={error}
      errorText={errorText()}
    />
  )
}

export default Question
