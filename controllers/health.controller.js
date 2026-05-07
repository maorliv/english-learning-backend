function getHealth(req, res) {
  res.status(200).json({
    success: true,
    data: {
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
}

module.exports = {
  getHealth,
};