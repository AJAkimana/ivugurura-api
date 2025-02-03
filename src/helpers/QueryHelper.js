const queryOptions = {};
export class QueryHelper {
  /**
   *
   * @param {import('sequelize').Model} model
   */
  constructor(model) {
    this.model = model;
  }
  async findOne(
    whereCondition = {},
    include = null,
    attributes,
    otherOptions = {},
  ) {
    return this.model.findOne({
      where: whereCondition,
      logging: false,
      include,
      attributes,
      ...otherOptions,
    });
  }
  async findAll(
    whereCondition,
    include,
    orderBy = [["createdAt", "DESC"]],
    attributes,
    offset = 0,
    limit = 20,
    group = null,
  ) {
    return this.model.findAll({
      order: orderBy,
      offset,
      limit,
      where: whereCondition,
      logging: false,
      include,
      attributes,
      group,
      ...queryOptions,
    });
  }
  async countWithIncludes(options = { where: {}, include: {} }) {
    const countOption = {
      logging: false,
      ...options,
    };
    return this.model.count(countOption);
  }
  async count(options = {}) {
    const countOption = {
      logging: false,
      ...options,
      limit: undefined,
      offset: undefined,
    };
    return this.model.count(countOption);
  }
  async findAndCountAll(options = {}) {
    const defaultOptions = {
      order: [["createdAt", "DESC"]],
      logging: false,
      ...queryOptions,
    };
    return this.model.findAndCountAll({
      ...defaultOptions,
      ...options,
    });
  }
  async create(data) {
    return this.model.create(data, { logging: false });
  }
  async update(data, whereCondition = {}) {
    return this.model.update(data, { where: whereCondition, logging: false });
  }
  async delete(whereCondition) {
    return this.model.destroy({
      where: whereCondition,
      logging: false,
    });
  }
  async findOrCreate(whereCondition, defaults) {
    return this.model.findOrCreate({
      where: whereCondition,
      defaults,
      logging: false,
    });
  }
}
