/**
 * Express middleware that logs each incoming request after the response is sent.
 * Logs: timestamp, HTTP method, URL, response status code, and total response time in ms.
 */
function logger(req, res, next) {
  const startTime = Date.now();                    // Record when the request arrived
  const timestamp = new Date().toISOString();      // Human-readable timestamp (ISO 8601)

  // 'finish' fires after the response has been fully sent to the client
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;   // How long the request took

    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`
    );
  });

  // Pass control to the next middleware — must be called or the request will hang
  next();
}

module.exports = logger;