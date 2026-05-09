/**
 * Sends a successful JSON response in the project's standard envelope format.
 *
 * @param {object} res        - Express response object
 * @param {number} statusCode - HTTP status code (e.g. 200, 201)
 * @param {*}      data       - The payload to return inside the 'data' field
 */
function sendSuccess(res, statusCode, data) {
  // res.status() sets the HTTP status code; .json() serializes the object and ends the response
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
}

/**
 * Sends an error JSON response in the project's standard envelope format.
 *
 * @param {object} res        - Express response object
 * @param {number} statusCode - HTTP status code (e.g. 400, 404, 403, 500)
 * @param {string} code       - Machine-readable error code (e.g. 'VALIDATION_ERROR')
 * @param {string} message    - Human-readable description of the error
 * @param {object} details    - Optional extra context (e.g. which field failed validation)
 */
function sendError(res, statusCode, code, message, details = {}) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  });
}

// Export both helpers so any controller or middleware can import them
module.exports = {
  sendSuccess,
  sendError,
};