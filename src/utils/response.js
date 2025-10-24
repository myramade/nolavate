export class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200, meta = null) {
    const response = {
      success: true,
      data,
      message
    };

    if (meta) {
      response.meta = meta;
    }

    response.timestamp = new Date().toISOString();

    return res.status(statusCode).json(response);
  }

  static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    response.timestamp = new Date().toISOString();

    return res.status(statusCode).json(response);
  }

  static validationError(res, errors) {
    return this.error(res, 'Validation error', 400, errors);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static paginated(res, data, page, pageSize, total, additionalMeta = {}) {
    const totalPages = Math.ceil(total / pageSize);
    
    const meta = {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      ...additionalMeta
    };

    return this.success(res, data, 'Success', 200, meta);
  }
}

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 20,
  maxPageSize: 100
};
