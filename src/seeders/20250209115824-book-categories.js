"use strict";

const { bookCategories } = require("../helpers/constants");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const categories = Object.keys(bookCategories).flatMap(lang =>
      bookCategories[lang].items.map(item => ({
        name: item,
        languageId: bookCategories[lang].lang,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
    return queryInterface.bulkInsert("book_categories", categories, {});
  },

  async down(queryInterface) {
    return queryInterface.bulkDelete("book_categories", null, {});
  },
};
