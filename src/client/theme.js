import { useMediaQuery } from '@mui/material'
import { createTheme, responsiveFontSizes } from '@mui/material/styles'
import { useMemo } from 'react'

import { inStaging } from '../config'

const useTheme = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = useMemo(
    () =>
      responsiveFontSizes(
        createTheme({
          palette: {
            primary: {
              main: !inStaging ? '#1077A1' : '#77dcbb',
            },
          },
        }),
      ),
    [prefersDarkMode],
  )

  return theme
}

export default useTheme
