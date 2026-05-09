const express = require('express');

const conversationsRouter = require('./routes/conversations.routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const grammarRulesRouter = require('./routes/grammarRules.routes');
const logger = require('./middleware/logger.middleware');
const matchingRouter = require('./routes/matching.routes');
const notFound = require('./middleware/notFound.middleware');
const progressRouter = require('./routes/progress.routes');
const relationsRouter = require('./routes/relations.routes');
const healthRouter = require('./routes/health.routes');
const lessonsRouter = require('./routes/lessons.routes');
const studentsRouter = require('./routes/students.routes');
const teachersRouter = require('./routes/teachers.routes');
const usersRouter = require('./routes/users.routes');
const warmUpGrammarRouter = require('./routes/warmUpGrammar.routes');

const app = express();
const PORT = 3000;

app.use(logger);
app.use(express.json());
app.use('/', healthRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/grammar-rules', grammarRulesRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/matching', matchingRouter);
app.use('/api/progress', progressRouter);
app.use('/api/relations', relationsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/users', usersRouter);
app.use('/api/warm-up-grammar', warmUpGrammarRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
