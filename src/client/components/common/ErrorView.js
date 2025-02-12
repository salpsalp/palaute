import React from 'react'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'

import { Alert, Box, Card, CardMedia, Link as MuiLink, Typography } from '@mui/material'
import { KeyboardReturnOutlined } from '@mui/icons-material'

import ErrorDetails from './ErrorDetails'

/**
 * Display this with an appropriate message
 * when a component cannot be shown
 * because of a request error
 */
const ErrorView = ({ children, message, response, returnTo = '/feedbacks' }) => {
  const { t } = useTranslation()
  const { id } = useParams()

  const supportEmail = t('links:supportEmail')

  return (
    <Box m={4}>
      {response?.status && id ? (
        <ErrorDetails feedbackTargetId={id} message={message} response={response} />
      ) : (
        <Typography sx={{ mb: '2rem' }} variant="body1">
          {t(message)}
        </Typography>
      )}
      {response && (
        <Card sx={{ mx: 'auto', maxWidth: 500 }}>
          <CardMedia component="img" src={`https://http.cat/${response?.status}`} alt="" loading="lazy" />
        </Card>
      )}

      <Box mb={3} />
      <MuiLink to={returnTo} component={Link} underline="hover">
        <Box display="flex">
          {t('common:goBack')}
          <Box mr={1} />
          <KeyboardReturnOutlined />
        </Box>
      </MuiLink>
      <Box my={2}>{children}</Box>
      <Box mt={4}>
        <Alert variant="standard" severity="info">
          {t('common:supportContact')}
          <MuiLink href={`mailto:${supportEmail}`} underline="hover">
            {supportEmail}
          </MuiLink>
        </Alert>
      </Box>
    </Box>
  )
}

export default ErrorView
