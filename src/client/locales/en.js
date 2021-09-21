/* eslint-disable max-len */

export default {
  common: {
    languages: {
      fi: 'Finnish',
      sv: 'Swedish',
      en: 'English',
    },
    validationErrors: {
      required: 'This field is required',
      wrongDate: 'Survey closing date is before opening date',
    },
    unknownError: 'Something went wrong',
    save: 'Save',
    saveSuccess: 'Information has been saved',
    name: 'Name',
    edit: 'Edit',
    show: 'Show',
    feedbackOpenPeriod:
      'Feedback can be given between {{opensAt}} and {{closesAt}}',
    firstName: 'First name',
    lastName: 'Last name',
    username: 'Username',
    studentNumber: 'Student number',
    dirtyFormPrompt:
      'The page has unsaved changes. Are you sure want to leave the page?',
    actions: 'Actions',
    close: 'Close',
    required: 'Required',
    copy: 'Copy',
  },
  userFeedbacks: {
    mainHeading: 'My feedback',
    giveFeedbackButton: 'Give feedback',
    modifyFeedbackButton: 'Edit my feedback',
    clearFeedbackButton: 'Remove my feedback',
    clearConfirmationQuestion: 'Are you sure you want to remove your feedback?',
    yes: 'Yes',
    no: 'No',
    viewFeedbackSummary: 'View feedback summary',
    noFeedback: 'There are no courses or course feedbacks here yet',
    feedbackClosedTab: 'Closed',
    waitingForFeedbackTab: 'Waiting',
    feedbackGivenTab: 'Given',
    feedbackGivenChip: 'Feedback is given',
    waitingForFeedbackChip: 'Feedback is missing',
    feedbackNotStartedChip: 'Feedback has not started',
    feedbackEndedChip: 'Feedback has ended',
  },
  feedbackView: {
    submitButton: 'Give feedback',
    editButton: 'Edit feedback',
    successAlert: 'Feedback has been given. Thank you for your feedback!',
    feedbackInfo:
      'This feedback is anonymous. Fields marked with an asterisk (*) are required',
    feedbackInfoLink: 'Read more, how your information is being used',
    closedInfo:
      'This feedback is currently closed. Feedback can be given between {{opensAt}} and {{closesAt}}',
    privacyInfoTitle: 'How is my information being used?',
    privacyInfoContent:
      'The user information is used to show correct feedback surveys by using enrolment information. Teacher cannot see which student has given a certain feedback.',
    dontKnowOption: 'N/A',
    editSurvey: 'Edit survey',
    translationLanguage: 'Survey preview language',
    cannotSubmitText:
      'You cannot submit because you are not enrolled in this course',
    feedbackClosedError: 'Feedback is closed',
    endedInfo:
      'The feedback period has ended. <2>Take a look at the feedback</2>',
  },
  teacherView: {
    mainHeading: 'My teaching',
    showFeedbacks: 'Show feedback',
    showSurvey: 'Show survey',
    editSurvey: 'Edit survey',
    copyLink: 'Copy answer form link',
    copyResponseLink: 'Copy link to counter feedback',
    copied: 'Link copied to clipboard',
    showStudentsWithFeedback: 'Show students who have given feedback',
    feedbackCount: '{{count}}/{{totalCount}} feedback given',
    giveFeedbackResponse: 'Give counter feedback',
    noCourseRealisations: 'No course realisations',
    noCourses: 'No courses',
    editFeedbackResponse: 'Edit counter feedback',
    feedbackResponseGiven: 'Counter feedback given',
    feedbackResponseMissing: 'Counter feedback missing',
    feedbackOpen: 'Feedback open',
    ongoingCourses: 'Ongoing courses',
    upcomingCourses: 'Upcoming courses',
    endedCourses: 'Ended courses',
    feedbackNotStarted: 'Feedback has not started',
    surveyOpen: 'Feedback period: {{opensAt}}-{{closesAt}}',
  },
  questionEditor: {
    addQuestion: 'Add question',
    likertQuestion: 'Scale of values',
    openQuestion: 'Open question',
    singleChoiceQuestion: 'Single choice question',
    multipleChoiceQuestion: 'Multiple choice question',
    textualContent: 'Textual content',
    moveUp: 'Move up',
    moveDown: 'Move down',
    removeQuestion: 'Remove question',
    options: 'Options',
    option: 'Option',
    addOption: 'Add option',
    removeOption: 'Remove option',
    label: 'Question',
    content: 'Content',
    removeQuestionConfirmation:
      'Are you sure you want to remove this question?',
    removeOptionConfirmation: 'Are you sure you want to remove this option?',
    description: 'Description',
    done: 'Done',
    languageInfo:
      'Your are currently editing the "{{language}}" translation of this question',
    descriptionHelper:
      'Optional description that provides additional information about the question',
    universityQuestion: 'University level',
    programmeQuestion: 'Programme level',
    uneditableTooltip:
      'This is predefined and automatically added to the survey and it can not be edited or removed',
    duplicate: 'Duplicate',
  },
  editFeedbackTarget: {
    closesAt: 'Closes at',
    opensAt: 'Opens at',
    hidden: 'Hidden',
    upperLevelQuestionsInfo:
      'Survey already has {{count}} university and programme level questions, but you can add additional questions. You can click the "Show survey preview" button to see what the survey looks like with all the questions',
    showPreview: 'Show survey preview',
    translationLanguage: 'Translation language',
    warningAboutOpeningCourse:
      'NB! The survey cannot be edited after the feedback opens. The feedback must be open at least for a day',
    noUnsavedChanges: 'No unsaved changes',
    openImmediately: 'Open feedback now',
    openImmediatelyConfirm:
      'When feedback is open the survey can no longer be edited, do you still want to open the feedback?',
    copyFromCourseDialogTitle: 'Copy questions from another course',
    copySuccessSnackbar: 'The questions have been copied into the survey',
    copyQuestionsButton: 'Copy questions',
    copyFromCourseButton: 'Copy questions from another course',
    copyFromCourseInfoAlert:
      'You can copy questions from courses that you teach. First, choose the course and then the realisation from which you want to copy the questions',
    copyFromCourseChooseCourse: 'Choose a course to see its realisations',
    copyFromCourseNoQuestions:
      'None of the realisations on the course have any questions',
    copyFromCourseQuestionCount: '{{count}} questions',
    copyFromCourseSearchLabel: 'Course',
    openFeedbackImmediatelyDialogTitle: 'Warning!',
    openFeedbackImmediatelyDialogContent:
      "You are about to open the course's feedback. Note that once the course's feedback is open you won't be able to edit its survey or the feedback period dates.",
    openFeedbackImmediatelyDialogCancel: 'Cancel',
    openFeedbackImmediatelyDialogConfirm: 'Open feedback',
    opensAtInPastError: "Opening date can't be in the past",
    closesAtBeforeOpensAtError: 'Closing date has to be after the opening date',
    tooShortFeedbackPeriodError: 'The feedback must open at least for a day',
  },
  questionResults: {
    answerCount: 'Answer count',
    answerOption: 'Answer option',
    publicInfo:
      'The results from these questions are visible to students. <2>Select public questions</2>',
    notPublicInfo:
      'The results from these questions are not visible to students. <2>Select public questions</2>',
  },
  feedbackSummary: {
    question: 'Question',
    average: 'Average',
    standardDeviation: 'Standard Deviation',
    median: 'Median',
    answers: 'Answers',
  },
  feedbackTargetResults: {
    notEnoughFeedbacksInfo:
      'Survey results will not be displayed because it does not have enough feedback',
    onlyForEnrolledInfo:
      'Survey results will not be displayed because the teacher has set feedback visible only for enrolled students',
    studentsWithFeedbackHeading: 'Students who have given feedback',
    responseHeading: "Teacher's counter feedback",
    giveResponse: 'Give counter feedback',
    editResponse: 'Edit counter feedback',
    noResponseInfo: "The course's teacher has not given a counter feedback yet",
    exportCsv: 'Download feedback as a CSV file',
    thankYouMessage:
      'Thank you for the feedback, here is a summary of the feedback so far.',
    closeImmediately: 'Close feedback immediately',
    closeImmediatelyConfirm: `Feedback can't be collected after it is closed. Are you sure you want to close the feedback immediately?`,
    closeImmediatelyTomorrowConfirm: `Feedback will be closed {{date}}, so that it's open for atleast a day. Feedback can't be collected after it is closed. Are you sure you want to close the feedback immediately?`,
  },
  navBar: {
    myFeedbacks: 'My feedback',
    myCourses: 'My teaching',
    logOut: 'Log out',
    admin: 'Admin',
    courseSummary: 'Course summary',
    nameFallback: 'Menu',
  },
  studentsWithFeedback: {
    noFeedbackInfo:
      "The list of students who have given feedback cannot be shown. Either there are less than five students who have given feedback or the list of students who have given feedback is disabled in the programme's settings",
    studentsList: 'Students who have given feedback',
  },
  feedbackResponse: {
    responseLabel: 'Counter feedback',
    responseInfo: 'This field supports <2>Markdown</2> content',
    previewLabel: 'Preview',
    sendEmail: 'Send email notification about counter feedback to students',
    instructionTitle: 'Instructions for counter feedback',
    responseInstruction:
      'Having reviewed the course feedback from students, the teacher may give a summarising response to the feedback. This feedback on feedback can be freely formulated and will be sent simultaneously to all the students on the course.',
  },
  publicQuestions: {
    publicInfo:
      'Feedback related to public questions is visible to students on the <2>feedback page</2> once the feedback period has ended. Note that feedback related to university level Likert scale questions is always visible for students once the feedback period has ended',
    selectVisibility: 'Select who can see the public questions',
    none: 'Only programme personel',
    enrolled: 'Enrolled students',
    everyone: 'Everyone',
  },
  courseSummary: {
    heading: 'Summary of course feedback',
    noResults: 'No feedback',
    feedbackResponse: 'Latest course feedback response given',
    feedbackCount: 'Feedback count',
    feedbackResponseGiven: 'Feedback response has been given',
    feedbackResponseNotGiven: 'Feedback response has not been given',
    feedbackStillOpen: 'Feedback for this course is still ongoing',
    courseOngoing: 'The course is still ongoing',
    editProgrammeSettings: "Edit programme's settings",
    courseRealisation: 'Course realisation',
    searchLabel: 'Filter courses',
    searchPlaceholder: 'Filter courses by course code',
    responsibleTeachers: 'Responsible teachers',
    includeOpenUniCourses: 'Include open university courses',
  },
  organisationView: {
    organisations: 'Organisations',
    noOrganisations: 'This user is not a part of any organisations',
    organisationName: 'Name',
    organisationCode: 'Organisation code',
  },
  editProgrammeSurvey: {
    noWriteAccess: `You don't have the rights to edit the programme survey`,
    upperLevelQuestionsInfo: `Survey already has {{count}} university level questions, but you can add additional questions.`,
    bigBoss:
      'Programme survey and settings can be edited by programme personel',
    studentListVisible: 'Student list visible',
    programmeSettings: 'Programme settings',
  },
  footer: {
    contactSupport: 'Contact support',
    wikiLink: 'User instructions',
  },
  courseRealisationFeedback: {
    noFeedbackTarget: 'This course does not have a feedback available to you',
  },
  organisationSettings: {
    surveyInfo:
      "Programme level questions are displayed in every programme's course's surveys after the university level questions. Survey already has {{count}} university level questions, but you can add additional questions",
    studentListVisible:
      "Show course's teacher students who have given feedback if at least five students have given feeedback",
    courseSettingsInfo: 'Feedback is only collected from activated courses',
    generalTab: 'General settings',
    coursesTab: 'Activated courses',
    surveyTab: 'Programme survey',
  },
  feedbackTargetView: {
    feedbackDisabled: 'This feedback is disabled',
    surveyTab: 'Survey',
    feedbacksTab: 'Feedback',
    feedbackResponseTab: 'Counter feedback',
    editSurveyTab: 'Edit survey',
    studentsWithFeedbackTab: 'Respondents',
    linkCopied: 'A link to the feedback has been copied to clipboard',
    copyLink: "Copy student's feedback link",
    editFeedbackTab: 'Edit feedback',
    coursePeriod: 'Course ongoing',
    feedbackPeriod: 'Feedback open',
    coursePage: 'Course page',
  },
}
