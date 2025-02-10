"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Book extends Model {
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
      this.belongsTo(models.BookCategory, {
        as: "category",
        foreignKey: "categoryId",
      });
    }
  }
  Book.init(
    {
      name: DataTypes.STRING,
      summary: DataTypes.STRING,
      url: DataTypes.STRING,
      coverImage: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Book",
      tableName: "books",
    },
  );
  return Book;
};
