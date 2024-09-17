class APIFeatures {
  constructor(query, urlQuery) {
    this.query = query;
    this.urlQuery = urlQuery;
  }

  filter() {
    const queryObj = { ...this.urlQuery };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((q) => delete queryObj[q]);

    // Advanced filtering
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );

    this.query = this.query.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    if (this.urlQuery.sort) {
      const sortBy = this.urlQuery.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('country cityName');
    }
    return this;
  }

  limit() {
    if (this.urlQuery.fields) {
      const fields = this.urlQuery.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.urlQuery.page * 1 || 1;
    const limit = this.urlQuery.limit * 1 || 50;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
