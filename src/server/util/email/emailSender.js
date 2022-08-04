const { Op } = require('sequelize')
const { addDays, subDays, format, differenceInHours } = require('date-fns')
const _ = require('lodash')

const {
  FeedbackTarget,
  CourseRealisation,
  CourseUnit,
  Organisation,
  User,
  UserFeedbackTarget,
} = require('../../models')

const {
  notificationAboutSurveyOpeningToStudents,
  emailReminderAboutSurveyOpeningToTeachers,
  emailReminderAboutFeedbackResponseToTeachers,
  sendEmail,
  sendNotificationAboutFeedbackResponseToStudents,
  sendReminderToGiveFeedbackToStudents,
} = require('./pate')

const { ApplicationError } = require('../customErrors')
const { sequelize } = require('../dbConnection')
const logger = require('../logger')

const getOpenFeedbackTargetsForStudents = async () => {
  const feedbackTargets = await FeedbackTarget.findAll({
    where: {
      opensAt: {
        [Op.lte]: new Date(),
      },
      closesAt: {
        [Op.gte]: new Date(),
      },
      hidden: false,
      feedbackType: 'courseRealisation',
    },
    include: [
      {
        model: CourseRealisation,
        as: 'courseRealisation',
        required: true,
        where: {
          startDate: { [Op.gt]: new Date('August 1, 2021 00:00:00') },
        },
      },
      {
        model: CourseUnit,
        as: 'courseUnit',
        required: true,
        attributes: ['courseCode', 'name'],
        include: [
          {
            model: Organisation,
            as: 'organisations',
            required: true,
            attributes: ['disabledCourseCodes'],
          },
        ],
      },
      {
        model: User,
        as: 'users',
        required: true,
        attributes: [
          'id',
          'username',
          'email',
          'language',
          'degreeStudyRight',
          'secondaryEmail',
        ],
        through: {
          where: {
            accessStatus: 'STUDENT',
          },
        },
      },
    ],
  })

  const filteredFeedbackTargets = feedbackTargets.filter((target) => {
    const disabledCourseCodes = target.courseUnit.organisations.flatMap(
      (org) => org.disabledCourseCodes,
    )

    if (!target.isOpen()) return false

    return !disabledCourseCodes.includes(target.courseUnit.courseCode)
  })

  return filteredFeedbackTargets
}

const getFeedbackTargetsAboutToOpenForTeachers = async () => {
  const feedbackTargets = await FeedbackTarget.findAll({
    where: {
      opensAt: {
        [Op.lt]: addDays(new Date(), 7),
        [Op.gt]: addDays(new Date(), 6),
      },
      feedbackOpeningReminderEmailSent: false,
      hidden: false,
      feedbackType: 'courseRealisation',
    },
    include: [
      {
        model: CourseRealisation,
        as: 'courseRealisation',
        required: true,
        where: {
          startDate: { [Op.gt]: new Date('August 1, 2021 00:00:00') },
        },
      },
      {
        model: CourseUnit,
        as: 'courseUnit',
        required: true,
        attributes: ['courseCode', 'name'],
        include: [
          {
            model: Organisation,
            as: 'organisations',
            required: true,
            attributes: ['disabledCourseCodes'],
          },
        ],
      },
      {
        model: User,
        as: 'users',
        required: true,
        attributes: ['id', 'username', 'email', 'language', 'secondaryEmail'],
        through: {
          where: {
            accessStatus: 'TEACHER',
          },
        },
      },
    ],
  })

  const filteredFeedbackTargets = feedbackTargets.filter((target) => {
    const disabledCourseCodes = target.courseUnit.organisations.flatMap(
      (org) => org.disabledCourseCodes,
    )
    return !disabledCourseCodes.includes(target.courseUnit.courseCode)
  })

  return filteredFeedbackTargets
}

const getFeedbackTargetOpeningImmediately = async (feedbackTargetId) => {
  const feedbackTarget = await FeedbackTarget.findAll({
    where: {
      id: feedbackTargetId,
      hidden: false,
      feedbackType: 'courseRealisation',
    },
    include: [
      {
        model: CourseRealisation,
        as: 'courseRealisation',
        required: true,
      },
      {
        model: CourseUnit,
        as: 'courseUnit',
        required: true,
        attributes: ['courseCode', 'name'],
        include: [
          {
            model: Organisation,
            as: 'organisations',
            required: true,
            attributes: ['disabledCourseCodes'],
          },
        ],
      },
      {
        model: User,
        as: 'users',
        required: true,
        attributes: ['id', 'username', 'email', 'language', 'secondaryEmail'],
      },
    ],
  })

  return feedbackTarget
}

const getFeedbackTargetsWithoutResponseForTeachers = async () => {
  const feedbackTargets = await FeedbackTarget.findAll({
    where: {
      closesAt: {
        [Op.lt]: new Date(),
        [Op.gt]: subDays(new Date(), 3),
      },
      hidden: false,
      feedbackType: 'courseRealisation',
      feedbackResponse: null,
      feedbackResponseReminderEmailSent: false,
    },
    include: [
      {
        model: CourseRealisation,
        as: 'courseRealisation',
        required: true,
        where: {
          startDate: { [Op.gt]: new Date('August 1, 2021 00:00:00') },
        },
      },
      {
        model: CourseUnit,
        as: 'courseUnit',
        required: true,
        attributes: ['courseCode', 'name'],
        include: [
          {
            model: Organisation,
            as: 'organisations',
            required: true,
            attributes: ['disabledCourseCodes'],
          },
        ],
      },
      {
        model: User,
        as: 'users',
        required: true,
        attributes: ['id', 'username', 'email', 'language', 'secondaryEmail'],
        through: {
          where: {
            accessStatus: 'TEACHER',
          },
        },
      },
      {
        model: UserFeedbackTarget,
        as: 'userFeedbackTargets',
        required: true,
        attributes: ['id', 'feedback_id'],
      },
    ],
  })

  const filteredFeedbackTargets = feedbackTargets.filter((target) => {
    const disabledCourseCodes = target.courseUnit.organisations.flatMap(
      (org) => org.disabledCourseCodes,
    )
    return !disabledCourseCodes.includes(target.courseUnit.courseCode)
  })

  const filteredByFeedbacks = filteredFeedbackTargets.filter((target) => {
    const found = target.userFeedbackTargets.find(
      (u) => u.dataValues.feedback_id,
    )
    return !!found
  })

  return filteredByFeedbacks
}

const getTeacherEmailCounts = async () => {
  const teacherEmailCounts = await sequelize.query(
    `SELECT f.opens_at, count(DISTINCT us.id) FROM feedback_targets f
        INNER JOIN user_feedback_targets u on u.feedback_target_id = f.id
        INNER JOIN course_realisations c on c.id = f.course_realisation_id
        INNER JOIN users us on us.id = u.user_id
        WHERE f.opens_at > :opensAtLow and f.opens_at < :opensAtHigh 
          AND u.access_status = 'TEACHER' 
          AND f.feedback_type = 'courseRealisation'
          AND f.feedback_opening_reminder_email_sent = false
          AND f.hidden = false
          AND c.start_date > '2021-8-1 00:00:00+00'
        GROUP BY f.opens_at`,
    {
      replacements: {
        opensAtLow: addDays(new Date(), 6),
        opensAtHigh: addDays(new Date(), 35),
      },
      type: sequelize.QueryTypes.SELECT,
    },
  )

  const groupedEmailCounts = _.groupBy(teacherEmailCounts, (obj) =>
    format(subDays(obj.opens_at, 7), 'dd.MM.yyyy'),
  )

  const finalEmailCounts = Object.keys(groupedEmailCounts).map((key) =>
    groupedEmailCounts[key].length > 1
      ? {
          date: key,
          count: groupedEmailCounts[key].reduce(
            (sum, obj) => sum + parseInt(obj.count, 10),
            0,
          ),
        }
      : { date: key, count: parseInt(groupedEmailCounts[key][0].count, 10) },
  )

  return finalEmailCounts
}

const getStudentEmailCounts = async () => {
  const studentEmailCounts = await sequelize.query(
    `SELECT f.opens_at, count(DISTINCT us.id) FROM feedback_targets f
        INNER JOIN user_feedback_targets u on u.feedback_target_id = f.id
        INNER JOIN course_realisations c on c.id = f.course_realisation_id
        INNER JOIN users us on us.id = u.user_id
        WHERE f.opens_at > :opensAtLow and f.opens_at < :opensAtHigh 
          AND u.access_status = 'STUDENT' 
          AND f.feedback_type = 'courseRealisation'
          AND f.hidden = false
          AND c.start_date > '2021-8-1 00:00:00+00'
          AND u.feedback_open_email_sent = false
        GROUP BY f.opens_at`,
    {
      replacements: {
        opensAtLow: subDays(new Date(), 1),
        opensAtHigh: addDays(new Date(), 28),
      },
      type: sequelize.QueryTypes.SELECT,
    },
  )

  const groupedEmailCounts = _.groupBy(studentEmailCounts, (obj) =>
    format(obj.opens_at, 'dd.MM.yyyy'),
  )

  const finalEmailCounts = Object.keys(groupedEmailCounts).map((key) =>
    groupedEmailCounts[key].length > 1
      ? {
          date: key,
          count: groupedEmailCounts[key].reduce(
            (sum, obj) => sum + parseInt(obj.count, 10),
            0,
          ),
        }
      : { date: key, count: parseInt(groupedEmailCounts[key][0].count, 10) },
  )
  return finalEmailCounts
}

const createRecipientsForFeedbackTargets = async (
  feedbackTargets,
  options = { primaryOnly: false, whereOpenEmailNotSent: false },
) => {
  // Leo if you are reading this you are allowed to refactor :)
  // Too late 😤

  const emails = {}

  feedbackTargets.forEach((feedbackTarget) => {
    feedbackTarget.users
      .filter(
        options.whereOpenEmailNotSent
          ? (u) => !u.UserFeedbackTarget.feedbackOpenEmailSent
          : () => true,
      )
      .forEach((user) => {
        const certainlyNoAdUser = user.username === user.id
        const possiblyNoAdUser =
          feedbackTarget.courseRealisation.isMoocCourse &&
          !user.degreeStudyright

        const sendToBothEmails =
          !options.primaryOnly && (certainlyNoAdUser || possiblyNoAdUser)

        const userEmails = [
          user.email,
          sendToBothEmails ? user.secondaryEmail : false,
        ]
        // for some users, email === secondaryEmail. In that case, use only primary.
        userEmails[1] = userEmails[0] === userEmails[1] ? false : userEmails[1]

        userEmails.filter(Boolean).forEach((email) => {
          emails[email] = (emails[email] ? emails[email] : []).concat([
            {
              id: feedbackTarget.id,
              userFeedbackTargetId: user.UserFeedbackTarget.id,
              name: feedbackTarget.courseUnit.name,
              opensAt: feedbackTarget.opensAt,
              closesAt: feedbackTarget.closesAt,
              language: user.language,
              noAdUser: certainlyNoAdUser,
              possiblyNoAdUser,
              userId: user.id,
              username: user.username,
            },
          ])
        })
      })
  })

  return emails
}

const createRecipientsForSingleFeedbackTarget = async (
  feedbackTarget,
  options,
) => createRecipientsForFeedbackTargets([feedbackTarget[0]], options)

const sendEmailAboutSurveyOpeningToStudents = async () => {
  const feedbackTargets = await getOpenFeedbackTargetsForStudents()

  const studentsWithFeedbackTargets = await createRecipientsForFeedbackTargets(
    feedbackTargets,
    { whereOpenEmailNotSent: true },
  )

  const emailsToBeSent = Object.keys(studentsWithFeedbackTargets).map(
    (student) =>
      notificationAboutSurveyOpeningToStudents(
        student,
        studentsWithFeedbackTargets[student],
      ),
  )

  const ids = Object.keys(studentsWithFeedbackTargets).flatMap((key) =>
    studentsWithFeedbackTargets[key].map(
      (course) => course.userFeedbackTargetId,
    ),
  )

  UserFeedbackTarget.update(
    {
      feedbackOpenEmailSent: true,
    },
    {
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    },
  )

  await sendEmail(emailsToBeSent, 'Notify students about feedback opening')

  return emailsToBeSent
}

const sendEmailReminderAboutSurveyOpeningToTeachers = async () => {
  const feedbackTargets = await getFeedbackTargetsAboutToOpenForTeachers()

  const teachersWithFeedbackTargets = await createRecipientsForFeedbackTargets(
    feedbackTargets,
    { primaryOnly: true },
  )

  const emailsToBeSent = Object.keys(teachersWithFeedbackTargets).map(
    (teacher) =>
      emailReminderAboutSurveyOpeningToTeachers(
        teacher,
        teachersWithFeedbackTargets[teacher],
      ),
  )

  const ids = feedbackTargets.map((target) => target.id)

  FeedbackTarget.update(
    {
      feedbackOpeningReminderEmailSent: true,
    },
    {
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    },
  )

  await sendEmail(emailsToBeSent, 'Remind teachers about feedback opening')

  return emailsToBeSent
}

const sendEmailReminderAboutFeedbackResponseToTeachers = async () => {
  const feedbackTargets = await getFeedbackTargetsWithoutResponseForTeachers()

  const teachersWithFeedbackTargets = await createRecipientsForFeedbackTargets(
    feedbackTargets,
    { primaryOnly: true },
  )

  const emailsToBeSent = Object.keys(teachersWithFeedbackTargets).map(
    (teacher) =>
      emailReminderAboutFeedbackResponseToTeachers(
        teacher,
        teachersWithFeedbackTargets[teacher],
      ),
  )

  const ids = feedbackTargets.map((target) => target.id)

  FeedbackTarget.update(
    {
      feedbackResponseReminderEmailSent: true,
    },
    {
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    },
  )

  await sendEmail(
    emailsToBeSent,
    'Remind teachers about giving feedback response',
  )

  return emailsToBeSent
}

const returnEmailsToBeSentToday = async () => {
  const studentFeedbackTargets = await getOpenFeedbackTargetsForStudents()
  const teacherFeedbackTargets =
    await getFeedbackTargetsAboutToOpenForTeachers()
  const teacherReminderTargets =
    await getFeedbackTargetsWithoutResponseForTeachers()

  const teacherEmailCountFor7Days = await getTeacherEmailCounts()
  const studentEmailCountFor7Days = await getStudentEmailCounts()

  const studentsWithFeedbackTargets = await createRecipientsForFeedbackTargets(
    studentFeedbackTargets,
    {
      whereOpenEmailNotSent: true,
    },
  )

  const teachersWithFeedbackTargets = await createRecipientsForFeedbackTargets(
    teacherFeedbackTargets,
    { primaryOnly: true },
  )

  const teacherRemindersWithFeedbackTargets =
    await createRecipientsForFeedbackTargets(teacherReminderTargets, {
      primaryOnly: true,
    })

  const studentEmailsToBeSent = Object.keys(studentsWithFeedbackTargets).map(
    (student) =>
      notificationAboutSurveyOpeningToStudents(
        student,
        studentsWithFeedbackTargets[student],
      ),
  )

  const teacherSurveyReminderEmails = Object.keys(
    teachersWithFeedbackTargets,
  ).map((teacher) =>
    emailReminderAboutSurveyOpeningToTeachers(
      teacher,
      teachersWithFeedbackTargets[teacher],
    ),
  )

  const teacherFeedbackReminderEmails = Object.keys(
    teacherRemindersWithFeedbackTargets,
  ).map((teacher) =>
    emailReminderAboutFeedbackResponseToTeachers(
      teacher,
      teacherRemindersWithFeedbackTargets[teacher],
    ),
  )

  const teacherEmailsToBeSent = [
    ...teacherSurveyReminderEmails,
    ...teacherFeedbackReminderEmails,
  ]

  return {
    students: studentEmailsToBeSent,
    teachers: teacherEmailsToBeSent,
    teacherEmailCounts: teacherEmailCountFor7Days,
    studentEmailCounts: studentEmailCountFor7Days,
  }
}

const sendEmailToStudentsWhenOpeningImmediately = async (feedbackTargetId) => {
  const feedbackTarget = await getFeedbackTargetOpeningImmediately(
    feedbackTargetId,
  )

  if (!feedbackTarget.length)
    throw new ApplicationError(
      'Students already recieved a feedback open notification',
      400,
    )

  const studentsWithFeedbackTarget =
    await createRecipientsForSingleFeedbackTarget(feedbackTarget, {
      whereOpenEmailNotSent: true,
    })

  const studentEmailsToBeSent = Object.keys(studentsWithFeedbackTarget).map(
    (student) =>
      notificationAboutSurveyOpeningToStudents(
        student,
        studentsWithFeedbackTarget[student],
      ),
  )

  const ids = Object.values(studentsWithFeedbackTarget).map(
    (value) => value.userFeedbackTargetId,
  )

  UserFeedbackTarget.update(
    {
      feedbackOpenEmailSent: true,
    },
    {
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    },
  )

  await sendEmail(
    studentEmailsToBeSent,
    'Notify students about feedback opening immediately',
  )

  return studentEmailsToBeSent
}

/**
 * Automatically remind students 3 days before feedback closes
 * and feedback target has student list visible (SOS-feature)
 */
const sendEmailReminderOnFeedbackToStudents = async () => {
  const feedbackTargets = await sequelize.query(
    `
    SELECT DISTINCT fbt.*
    FROM feedback_targets as fbt

    INNER JOIN course_units as cu ON cu.id = fbt.course_unit_id
    INNER JOIN course_units_organisations as cuo ON cu.id = cuo.course_unit_id
    INNER JOIN organisations as org ON org.id = cuo.organisation_id

    WHERE cu.course_code = ANY (org.student_list_visible_course_codes)
    AND fbt.closes_at > NOW() + interval '0 days'
    AND fbt.closes_at < NOW() + interval '30 days'
    AND (
      fbt.feedback_reminder_last_sent_at IS NULL
      OR fbt.feedback_reminder_last_sent_at < NOW() - interval '24 hours'
    )
  `,
    {
      model: FeedbackTarget,
      mapToModel: true,
    },
  )

  logger.info(
    `[Pate] Sending automatic reminder for ${feedbackTargets.length} feedback targets`,
  )

  await Promise.all(
    feedbackTargets.map((fbt) => fbt.sendFeedbackReminderToStudents('')),
  )
}

const sendFeedbackSummaryReminderToStudents = async (
  feedbackTarget,
  feedbackResponse,
) => {
  const courseUnit = await feedbackTarget.getCourseUnit()
  const cr = await feedbackTarget.getCourseRealisation()
  const students = await feedbackTarget.getStudentsForFeedbackTarget()
  const url = `https://coursefeedback.helsinki.fi/targets/${feedbackTarget.id}/results`
  const formattedStudents = students
    .filter((student) => student.email)
    .map((student) => ({
      email: student.email,
      language: student.language || 'en',
    }))
  return sendNotificationAboutFeedbackResponseToStudents(
    url,
    formattedStudents,
    courseUnit.name,
    cr.startDate,
    cr.endDate,
    feedbackResponse,
  )
}

const sendFeedbackReminderToStudents = async (feedbackTarget, reminder) => {
  if (differenceInHours(new Date(), this.feedbackReminderLastSentAt) < 24) {
    throw new ApplicationError(
      'Can send only 1 feedback reminder every 24 hours',
      403,
    )
  }

  const courseUnit = await CourseUnit.findByPk(feedbackTarget.courseUnitId)
  const students = await feedbackTarget.getStudentsWhoHaveNotGivenFeedback()
  const url = `https://coursefeedback.helsinki.fi/targets/${feedbackTarget.id}/feedback`
  const formattedStudents = students
    .filter((student) => student.email)
    .map((student) => ({
      email: student.email,
      language: student.language || 'en',
    }))

  const formattedClosesAt = format(
    new Date(feedbackTarget.closesAt),
    'dd.MM.yyyy',
  )

  return (async () => {
    const emails = await sendReminderToGiveFeedbackToStudents(
      url,
      formattedStudents,
      courseUnit.name,
      reminder,
      formattedClosesAt,
    )

    feedbackTarget.feedbackReminderLastSentAt = new Date()
    await feedbackTarget.save()

    return emails
  })()
}

module.exports = {
  sendEmailAboutSurveyOpeningToStudents,
  sendEmailReminderAboutSurveyOpeningToTeachers,
  sendEmailToStudentsWhenOpeningImmediately,
  sendEmailReminderAboutFeedbackResponseToTeachers,
  sendEmailReminderOnFeedbackToStudents,
  sendFeedbackSummaryReminderToStudents,
  sendFeedbackReminderToStudents,
  returnEmailsToBeSentToday,
}