import { makeStyles } from '@material-ui/core'

const useGlobalStyles = makeStyles((theme) => ({
  '@global': {
    '.shadow-scale-hover-effect': {
      transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
      borderRadius: theme.shape.borderRadius,
      '&:hover': {
        transform: 'scale(1.01, 1.02)',
      },
      '&::after': {
        content: '""',
        borderRadius: theme.shape.borderRadius,
        position: 'absolute',
        zIndex: -1,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        opacity: 0,
        '-webkit-transition': 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
        transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
      },
      '&:hover::after': {
        opacity: 1,
      },
    },
  },
}))

export default useGlobalStyles
