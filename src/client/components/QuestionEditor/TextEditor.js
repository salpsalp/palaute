import { Box, Grid, Typography } from '@mui/material'
import React from 'react'

import { useTranslation, Trans } from 'react-i18next'

import FormikTextField from '../FormikTextField'
import Alert from '../Alert'
import AlertLink from '../AlertLink'

const LanguageTextEditor = ({ name, language }) => {
  const { i18n } = useTranslation()
  const t = i18n.getFixedT(language)

  return (
    <>
      <Box mb={3}>
        <Alert severity="info">
          <Trans i18nKey="feedbackResponse:responseInfo">
            This field supports{' '}
            <AlertLink href="https://commonmark.org/help/" target="_blank">
              Markdown
            </AlertLink>{' '}
            syntax
          </Trans>
        </Alert>
      </Box>
      <FormikTextField
        id={`textual-context-text-${language}-${name}`}
        name={`${name}.data.content.${language}`}
        label={t('questionEditor:content')}
        fullWidth
        multiline
      />
    </>
  )
}

const TextEditor = ({ name, languages = ['fi', 'sv', 'en'] }) => (
  <Grid spacing={4} container>
    {languages.map((language) => (
      <Grid md={4} sm={12} xs={12} item key={language}>
        <Box mb={2}>
          <Typography variant="h6" component="h2">
            {language.toUpperCase()}
          </Typography>
        </Box>

        <LanguageTextEditor name={name} language={language} />
      </Grid>
    ))}
  </Grid>
)

export default TextEditor
