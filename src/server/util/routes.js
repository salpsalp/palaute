const Router = require('express')
const Sentry = require('@sentry/node')
const accessLogger = require('../middleware/accessLogger')
const currentUserMiddleware = require('../middleware/currentUserMiddleware')
const shibbolethCharsetMiddleware = require('../middleware/shibbolethCharsetMiddleware')
const errorMiddleware = require('../middleware/errorMiddleware')
const initializeSentry = require('./sentry')
const feedbacks = require('../controllers/feedbacksController')
const users = require('../controllers/userController')
const surveys = require('../controllers/surveysController')
const feedbackTargets = require('../controllers/feedbackTargetController')
const adminController = require('../controllers/adminController')
// const questions = require('../controllers/questionsController')

const router = Router()

initializeSentry(router)

router.use(Sentry.Handlers.requestHandler())
router.use(Sentry.Handlers.tracingHandler())

router.use(Router.json())

router.use(shibbolethCharsetMiddleware)
router.use(accessLogger)
router.use(currentUserMiddleware)

router.get('/login', users.getUser)
router.get('/logout', users.logout)
router.post('/feedbacks', feedbacks.create)
router.get('/feedbacks/:id', feedbacks.getOne)
router.put('/feedbacks/:id', feedbacks.update)
router.delete('/feedbacks/:id', feedbacks.destroy)

router.get('/feedback-targets/for-student', feedbackTargets.getForStudent)
router.get('/feedback-targets/:id', feedbackTargets.getOne)
router.put('/feedback-targets/:id', feedbackTargets.update)
router.get('/feedback-targets/:id/feedbacks', feedbackTargets.getFeedbacks)
router.put(
  '/feedback-targets/:id/reply',
  feedbackTargets.updateFeedbackResponse,
)

router.get(
  '/feedback-targets/:id/students-with-feedback',
  feedbackTargets.getStudentsWithFeedback,
)

router.put('/surveys/:id', surveys.update)
router.post('/surveys/:id/questions', surveys.addQuestion)
router.get('/surveys/university', surveys.getUniversitySurvey)

/*
router.get('/questions', questions.getAll)
router.get('/questions/:id', questions.getOne)
router.put('/questions/:id', questions.update)
router.delete('/questions/:id', questions.destroy)
These paths are not used anywhere at the moment
*/
router.get(
  '/course-units/responsible',
  feedbackTargets.getCourseUnitsForTeacher,
)

router.get(
  '/course-units/:id/feedback-targets',
  feedbackTargets.getTargetsByCourseUnit,
)

router.get('/course-units/:code/survey', surveys.getSurveyByCourseCode)

router.use('/admin', adminController)

router.use(Sentry.Handlers.errorHandler())

router.use(errorMiddleware)

module.exports = router
