const express = require('express');

const errorHandler = require('./middleware/errorHandler.middleware');
const logger = require('./middleware/logger.middleware');
const notFound = require('./middleware/notFound.middleware');
const healthRouter = require('./routes/health.routes');

const app = express();
const PORT = 3000;

app.use(logger);
app.use(express.json());
app.use('/', healthRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
