import React, { useState } from 'react'
import { Button } from '@mui/material'
import { Edit } from '@mui/icons-material'

import { useSnackbar } from 'notistack'
import { useParams } from 'react-router-dom'

import { useTranslation } from 'react-i18next'
import { useFeedbackTargetContext } from './FeedbackTargetContext'
import { useEditInterimFeedbackMutation } from './tabs/InterimFeedback/useInterimFeedbackMutation'
import { getInterimFeedbackEditSchema } from './tabs/InterimFeedback/utils'
import InterimFeedbackEditor from './tabs/InterimFeedback/InterimFeedbackEditor'

const EditInterimFeedback = () => {
  const { t } = useTranslation()
  const { id: parentId } = useParams()
  const { enqueueSnackbar } = useSnackbar()
  const { feedbackTarget: interimFeedback } = useFeedbackTargetContext()
  const [showForm, setShowForm] = useState(false)

  const editMutation = useEditInterimFeedbackMutation(parentId)

  const surveyValues = {
    name: interimFeedback.name,
    startDate: interimFeedback.opensAt,
    endDate: interimFeedback.closesAt,
  }

  const interimFeedbackSchema = getInterimFeedbackEditSchema(t)

  const handleClose = () => setShowForm(!showForm)

  const handleSubmit = async data => {
    const values = {
      fbtId: interimFeedback.id,
      ...data,
    }

    await editMutation.mutateAsync(values, {
      onSuccess: () => {
        handleClose()
        enqueueSnackbar(t('common:saveSuccess'), { variant: 'success' })
      },
      onError: error => {
        handleClose()
        enqueueSnackbar(t('common:unknownError'), { variant: 'error' })
      },
    })
  }

  return (
    <>
      <Button data-cy="feedback-target-edit-period" onClick={handleClose} variant="text" startIcon={<Edit />}>
        {t('feedbackTargetSettings:editPeriodTitle')}
      </Button>

      <InterimFeedbackEditor
        title={t('interimFeedback:editSurvey')}
        initialValues={surveyValues}
        validationSchema={interimFeedbackSchema}
        handleSubmit={handleSubmit}
        editing={showForm}
        onStopEditing={handleClose}
        editView
      />
    </>
  )
}

export default EditInterimFeedback
