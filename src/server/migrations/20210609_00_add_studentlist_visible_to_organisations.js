const { BOOLEAN } = require('sequelize')

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('organisations', 'student_list_visible', {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('organisations, student_list_visible')
  },
}
