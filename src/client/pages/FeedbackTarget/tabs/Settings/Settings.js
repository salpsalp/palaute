import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { Box } from '@mui/material'

import useUpdateSettingsRead from './useUpdateSettingsRead'
import EditFeedbackTarget from './EditFeedbackTarget'
import { useFeedbackTargetContext } from '../../FeedbackTargetContext'

const Settings = () => {
  const { id: feedbackId, interimFeedbackId } = useParams()
  const id = interimFeedbackId || feedbackId

  const updateSettingsRead = useUpdateSettingsRead()
  const { feedbackTarget, isResponsibleTeacher, isAdmin } = useFeedbackTargetContext()

  useEffect(() => {
    if (feedbackTarget.settingsReadByTeacher || !isResponsibleTeacher || isAdmin) {
      return
    }
    updateSettingsRead.mutateAsync({ id })
  }, [])

  return (
    <Box>
      <EditFeedbackTarget />
    </Box>
  )
}

export default Settings
