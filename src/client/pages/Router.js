import { Container } from '@mui/material'
import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'

import Admin from './Admin'
import useCourseSummaryAccessInfo from '../hooks/useCourseSummaryAccessInfo'
import MyTeaching from './MyTeaching'
import CourseRealisation from './CourseRealisation'
import Organisation from './Organisation'
import FeedbackTarget from './FeedbackTarget'
import NorppaFeedback from './NorppaFeedback'
import { LoadingProgress } from '../components/common/LoadingProgress'
import useIsMobile from '../hooks/useIsMobile'
import MyFeedbacks from './MyFeedbacks/MyFeedbacks'
import Summary from './CourseSummary/SummaryV2/Summary'

const styles = {
  container: theme => ({
    padding: '2rem',
    [theme.breakpoints.up('xl')]: {
      maxWidth: '80vw',
    },
    [theme.breakpoints.down('md')]: {
      padding: '1rem',
    },
    [theme.breakpoints.down('sm')]: {
      padding: '0.6rem',
    },
    marginTop: '1rem',
  }),
}

const Home = () => {
  const { courseSummaryAccessInfo, isLoading: accessInfoLoading } = useCourseSummaryAccessInfo()
  const isMobile = useIsMobile()

  if (accessInfoLoading) {
    return <LoadingProgress />
  }

  if (!isMobile && courseSummaryAccessInfo.adminAccess) {
    return <Redirect to="/course-summary" />
  }

  if (courseSummaryAccessInfo.accessible) {
    return <Redirect to="/courses" />
  }
  return <Redirect to="/feedbacks" />
}

const Router = () => (
  <Container sx={styles.container}>
    <Switch>
      <Route path="/" component={Home} exact />
      <Route path="/feedbacks" component={MyFeedbacks} exact />
      <Route path="/courses" component={MyTeaching} exact />
      <Route path="/targets/:id" component={FeedbackTarget} />
      <Route path="/organisations/:code" component={Organisation} />
      <Route path="/course-summary" component={Summary} />
      <Route path="/cur/:id" component={CourseRealisation} />
      <Route path="/norppa-feedback" component={NorppaFeedback} />
      <Route path="/admin" component={Admin} />
    </Switch>
  </Container>
)

export default Router
