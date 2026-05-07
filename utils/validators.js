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

module.exports = {
  validateIdParam,
};