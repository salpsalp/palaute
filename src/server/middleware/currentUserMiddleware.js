const { ApplicationError } = require('../util/customErrors')
const importerClient = require('../util/importerClient')
const logger = require('../util/logger')
const { ADMINS } = require('../util/config')
const { User } = require('../models')

const isSuperAdmin = (username) => ADMINS.includes(username)

const fetchUserDataFromLoginAsForHeaders = async (headers) => {
  if (!isSuperAdmin(headers.uid)) return headers

  const loggedInAs = headers['x-admin-logged-in-as']
  if (!loggedInAs) return headers

  const newHeaders = { ...headers }

  const user = await User.findOne({ where: { id: loggedInAs } })
  if (user) {
    newHeaders.uid = user.username
    newHeaders.givenname = user.first_name
    newHeaders.sn = user.last_name
    newHeaders.mail = user.email
    newHeaders.preferredlanguage = user.language
    newHeaders.hypersonsisuid = user.id
    return newHeaders
  }

  const { data } = await importerClient.get(`/palaute/persons`, {
    params: { id: loggedInAs },
  })

  const { id, firstNames, lastName, eduPersonPrincipalName } = data.persons[0]

  newHeaders.hypersonsisuid = id
  newHeaders.givenname = firstNames
  newHeaders.sn = lastName
  const [username] = eduPersonPrincipalName.split('@')[0]
  newHeaders.uid = username

  return newHeaders
}

const upsertUser = async ({
  uid,
  givenname,
  sn,
  mail,
  preferredlanguage,
  hypersonsisuid,
}) => {
  const [user] = await User.upsert({
    id: hypersonsisuid,
    first_name: givenname,
    last_name: sn,
    email: mail,
    language: preferredlanguage,
    username: uid,
  })

  return user
}

const currentUserMiddleware = async (req, res, next) => {
  const { uid: username } = req.headers
  if (!username) throw new ApplicationError('Missing uid header', 403)

  req.headers = await fetchUserDataFromLoginAsForHeaders(req.headers)

  req.user = await upsertUser(req.headers)

  return next()
}

module.exports = currentUserMiddleware
