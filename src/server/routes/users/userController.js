const { Op } = require('sequelize')
const _ = require('lodash')

const { Router } = require('express')
const { ApplicationError } = require('../../util/customErrors')
const { User, Banner } = require('../../models')
const { getUserIams } = require('../../util/jami')
const { getAllOrganisationAccess } = require('../../services/organisationAccess')
const { getLastRestart } = require('../../util/lastRestart')
const { ADMINS } = require('../../util/config')

const login = async (req, res) => {
  const { user, isAdmin, loginAs } = req
  const iamGroups = req.noad ? [] : req.iamGroups ?? []

  if (!loginAs) {
    user.lastLoggedIn = new Date()
    await user.save()
  }

  const lastRestart = await getLastRestart()
  const banners = await Banner.getForUser(user)

  const isTeacher = !!user.employeeNumber

  return res.send({
    ...user.toJSON(),
    isTeacher,
    iamGroups,
    isAdmin,
    lastRestart,
    banners,
  })
}

const getUserByEmail = async (req, res) => {
  const {
    query: { email },
  } = req

  const params = { email }

  const persons = await User.findAll({
    attributes: ['id', 'firstName', 'lastName', 'email', 'secondaryEmail'],
    where: {
      [Op.or]: {
        email: { [Op.iLike]: `${email}%` },
        secondaryEmail: { [Op.iLike]: `${email}%` },
      },
    },
    limit: 10,
  })

  return res.send({
    params,
    persons,
  })
}

const getUserDetails = async (req, res) => {
  const { id } = req.params
  if (id !== req.user.id && !ADMINS.includes(req.user.username)) {
    throw new ApplicationError('Non-admin can only view own user details', 403)
  }

  const user = await User.findByPk(id)
  const iamGroups = await getUserIams(id)

  user.iamGroups = iamGroups
  const access = _.sortBy(await user.getOrganisationAccess(), access => access.organisation.code)

  return res.send({
    ...user.dataValues,
    iamGroups,
    access,
  })
}

const getAllUserAccess = async (req, res) => {
  if (!ADMINS.includes(req.user.username)) throw new ApplicationError('Forbidden', 403)

  const usersWithAccess = await getAllOrganisationAccess()

  return res.send(usersWithAccess)
}

const logout = async (req, res) => {
  const {
    headers: { shib_logout_url: shibLogoutUrl },
  } = req

  return res.send({
    url: shibLogoutUrl,
  })
}

const router = Router()

router.get('/login', login)
router.get('/logout', logout)
router.get('/users', getUserByEmail)
router.get('/users/access', getAllUserAccess)
router.get('/users/:id', getUserDetails)

module.exports = router
