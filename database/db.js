const { Sequelize } = require("sequelize");

module.exports = new Sequelize("pswd", "root", "", {
  host: "localhost",
  dialect: "mysql",
});
