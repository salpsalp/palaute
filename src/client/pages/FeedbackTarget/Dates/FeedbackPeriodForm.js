import React, { useState, useRef } from 'react'
import { Box, Button, Tooltip, Link, Alert } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { Formik, Form } from 'formik'
import { WarningAmber } from '@mui/icons-material'

import FormikDatePicker from '../../../components/common/FormikDatePicker'
import OpenFeedbackImmediatelyDialog from './OpenFeedbackImmediatelyDialog'
import { validateFeedbackPeriod, requiresSubmitConfirmation, getFeedbackPeriodInitialValues } from './utils'
import { TooltipButton } from '../../../components/common/TooltipButton'
import feedbackTargetIsOpen from '../../../util/feedbackTargetIsOpen'
import CardSection from '../../../components/common/CardSection'
import { useFeedbackTargetContext } from '../FeedbackTargetContext'
import { useOpenImmediately, useUpdateDates } from './api'
import useInteractiveMutation from '../../../hooks/useInteractiveMutation'

const FeedbackPeriodForm = () => {
  const { t } = useTranslation()
  const { feedbackTarget, isResponsibleTeacher, isOrganisationAdmin, isAdmin } = useFeedbackTargetContext()
  const updateDates = useUpdateDates(feedbackTarget)
  const openImmediately = useOpenImmediately(feedbackTarget)
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const submitPayloadRef = useRef()
  const warningOriginRef = useRef()

  const initialValues = getFeedbackPeriodInitialValues(feedbackTarget)
  const isOpen = feedbackTargetIsOpen(feedbackTarget)
  const isOver = Date.parse(feedbackTarget.closesAt) < Date.now()

  const formEnabled = ((isResponsibleTeacher || isOrganisationAdmin) && !isOver) || isAdmin

  const handleOpenFeedbackImmediately = useInteractiveMutation(() => openImmediately.mutateAsync())
  const handleSubmitFeedbackPeriod = useInteractiveMutation(dates => updateDates.mutateAsync(dates))

  const openImmediatelyEnabled = !(isOpen || isOver)

  const cannotOpenImmediatelyMessage = t('feedbackTargetSettings:cannotOpenImmediately')

  const handleOpenWarningDialog = () => setWarningDialogOpen(true)

  const closeWarningDialog = () => setWarningDialogOpen(false)

  const handleConfirmWarning = () => {
    const { current: warningOrigin } = warningOriginRef
    const { current: submitPayload } = submitPayloadRef

    if (warningOrigin === 'formSubmit') {
      handleSubmitFeedbackPeriod(...submitPayload)

      const [values, actions] = submitPayload

      actions?.resetForm({ values })
    } else {
      handleOpenFeedbackImmediately()
    }

    closeWarningDialog()
  }

  const handleSubmit = (values, actions) => {
    submitPayloadRef.current = [values, actions]
    warningOriginRef.current = 'formSubmit'

    if (requiresSubmitConfirmation(values)) {
      handleOpenWarningDialog()
    } else {
      handleSubmitFeedbackPeriod(values)
      actions?.resetForm({ values })
    }
  }

  const handleSubmitWithAdminPower = values => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('WARNING: using admin powers to circumvent validation. Are you sure?')) return
    handleSubmit(values)
  }

  const handleOpenImmediatelyClick = () => {
    warningOriginRef.current = 'openImmediately'

    handleOpenWarningDialog()
  }

  const submitButtonTooltip = errors => Object.values(errors).map(t).join('\n')

  return (
    <CardSection title={t('feedbackTargetSettings:editPeriodTitle')}>
      <OpenFeedbackImmediatelyDialog
        open={warningDialogOpen}
        onClose={closeWarningDialog}
        onConfirm={handleConfirmWarning}
      />
      <Formik initialValues={initialValues} onSubmit={handleSubmit} validate={validateFeedbackPeriod(isOpen, isOver)}>
        {({ dirty, errors, isValid, values }) => (
          <Form>
            <Alert severity="warning">
              <Trans
                i18nKey="editFeedbackTarget:warningAboutOpeningCourse"
                values={{ supportEmail: t('links:supportEmail') }}
                components={{
                  mailTo: <Link href={`mailto:${t('links:supportEmail')}`} underline="hover" />,
                }}
              />
            </Alert>
            <Box mb={1}>
              <FormikDatePicker
                name="opensAt"
                label={t('editFeedbackTarget:opensAt')}
                disablePast={!isAdmin}
                disabled={(!formEnabled || isOpen || isOver) && !isAdmin}
              />
            </Box>
            <Box mb={2}>
              <FormikDatePicker
                name="closesAt"
                label={t('editFeedbackTarget:closesAt')}
                disablePast={!isAdmin}
                disabled={!formEnabled}
              />
            </Box>
            <Box display="flex" justifyContent="space-between">
              {formEnabled && (
                <Tooltip title={submitButtonTooltip(errors)}>
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={!dirty || !formEnabled || (!isValid && !isAdmin)}
                      onClick={isAdmin && !isValid ? () => handleSubmitWithAdminPower(values) : undefined}
                    >
                      {t('common:save')} {isAdmin && !isValid ? '(ADMIN)' : ''}
                    </Button>
                  </span>
                </Tooltip>
              )}
              <TooltipButton
                variant="outlined"
                color="primary"
                onClick={handleOpenImmediatelyClick}
                disabled={!openImmediatelyEnabled}
                tooltip={cannotOpenImmediatelyMessage}
                endIcon={<WarningAmber />}
              >
                {t('editFeedbackTarget:openImmediately')}
              </TooltipButton>
            </Box>
          </Form>
        )}
      </Formik>
    </CardSection>
  )
}

export default FeedbackPeriodForm
