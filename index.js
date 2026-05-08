const express = require('express');

const errorHandler = require('./middleware/errorHandler.middleware');
const logger = require('./middleware/logger.middleware');
const notFound = require('./middleware/notFound.middleware');
const healthRouter = require('./routes/health.routes');
const teachersRouter = require('./routes/teachers.routes');
const usersRouter = require('./routes/users.routes');

const app = express();
const PORT = 3000;

app.use(logger);
app.use(express.json());
app.use('/', healthRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/users', usersRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
