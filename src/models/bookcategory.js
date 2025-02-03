"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BookCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Language, {
        as: "language",
        foreignKey: "languageId",
      });
    }
  }
  BookCategory.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "BookCategory",
    },
  );
  return BookCategory;
};
