require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { setupWebSocket } = require('./services/websocket');

const app = express();
const server = createServer(app);

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/calls', require('./routes/calls'));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'binder-api' }));

setupWebSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Binder API running on port ${PORT}`));
