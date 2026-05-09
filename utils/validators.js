/**
 * Validates that an ID parameter is a positive integer.
 * Used for numeric IDs coming from req.params or req.header.
 *
 * @param {*}      id        - The raw value to validate (may be a string from the URL)
 * @param {string} fieldName - Name of the field, used in error messages
 * @returns {{ isValid: boolean, value?: number, message?: string, details?: object }}
 */
function validateIdParam(id, fieldName = 'id') {
  if (id === undefined || id === null || String(id).trim() === '') {
    return {
      isValid: false,
      message: 'Missing required id parameter',
      details: {
        parameter: fieldName,
      },
    };
  }

  const normalizedId = String(id).trim();

  // Regex test: only digits are allowed (no decimals, no negative signs)
  if (!/^\d+$/.test(normalizedId)) {
    return {
      isValid: false,
      message: 'Invalid id parameter',
      details: {
        parameter: fieldName,
        value: id,
        expected: 'positive integer',
      },
    };
  }

  return {
    isValid: true,
    value: Number(normalizedId), // Return as a number so callers don't need to convert
  };
}

/**
 * Validates that an ID parameter is a non-empty string.
 * Used for string-based IDs such as grammar rule IDs (e.g. 'present-simple').
 *
 * @param {*}      id        - The raw value to validate
 * @param {string} fieldName - Name of the field, used in error messages
 * @returns {{ isValid: boolean, value?: string, message?: string, details?: object }}
 */
function validateStringIdParam(id, fieldName = 'id') {
  if (id === undefined || id === null || String(id).trim() === '') {
    return {
      isValid: false,
      message: 'Missing required id parameter',
      details: {
        parameter: fieldName,
      },
    };
  }

  return {
    isValid: true,
    value: String(id).trim(),
  };
}

/**
 * Checks that all required fields are present and non-empty in the request body.
 *
 * @param {object}   body           - req.body object from Express
 * @param {string[]} requiredFields - List of field names that must be present
 * @returns {{ isValid: boolean, message?: string, details?: object }}
 */
function validateRequiredFields(body, requiredFields) {
  // filter() returns only the fields that are missing or empty
  const missingFields = requiredFields.filter((field) => {
    const value = body[field];

    // Treat undefined, null, and empty string as missing
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: 'Missing required fields',
      details: {
        missingFields,
      },
    };
  }

  return {
    isValid: true,
  };
}

module.exports = {
  validateIdParam,
  validateStringIdParam,
  validateRequiredFields,
};