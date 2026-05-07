const express = require('express');

const healthRouter = require('./routes/health.routes');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/', healthRouter);

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
