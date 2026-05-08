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
    value: Number(normalizedId),
  };
}

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

function validateRequiredFields(body, requiredFields) {
  const missingFields = requiredFields.filter((field) => {
    const value = body[field];

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