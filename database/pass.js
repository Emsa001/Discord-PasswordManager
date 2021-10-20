const { DataTypes, Model } = require("sequelize");

module.exports = class config extends Model {
  static init(sequelize) {
    return super.init(
      {
        configId: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        category: { type: DataTypes.STRING },
        username: { type: DataTypes.STRING },
        password: { type: DataTypes.STRING },
        site: { type: DataTypes.STRING },
        owner: { type: DataTypes.STRING },
      },
      {
        tableName: "pswdb",
        timestamps: true,
        sequelize,
      }
    );
  }
};
