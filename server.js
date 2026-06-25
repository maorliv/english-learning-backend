// Entry point for the English Learning Platform backend.
// Creates the Express app, registers middleware, mounts all route handlers, and starts the server.

require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const prisma = require('./prisma/client');
const { initSocket } = require('./socket');

// Route modules — each file handles one resource (e.g. /api/users, /api/lessons)
const assessmentRouter = require('./routes/assessment.routes');
const authRouter = require('./routes/auth.routes');
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
const settingsRouter = require('./routes/settings.routes');
const studentsRouter = require('./routes/students.routes');
const teachersRouter = require('./routes/teachers.routes');
const usersRouter = require('./routes/users.routes');
const warmUpGrammarRouter = require('./routes/warmUpGrammar.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware — runs for every request, in order
app.use(logger);
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
		credentials: true,
	})
);
app.use(express.json());

// Route mounting — each router handles all routes under the given path prefix
app.use('/', healthRouter);
app.use('/api/assessment', assessmentRouter);
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/grammar-rules', grammarRulesRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/matching', matchingRouter);
app.use('/api/progress', progressRouter);
app.use('/api/relations', relationsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/users', usersRouter);
app.use('/api/warm-up-grammar', warmUpGrammarRouter);

// Serve React frontend in production
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res, next) => {
	if (req.path.startsWith('/api/')) return next();
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback middleware — must be registered after all routes
app.use(notFound);
app.use(errorHandler);

// Wrap Express in an HTTP server so Socket.IO can share the same port
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});

process.on('SIGINT', async () => {
	await prisma.$disconnect();
	process.exit(0);
});
