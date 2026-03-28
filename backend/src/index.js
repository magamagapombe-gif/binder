require('dotenv').config();

// Log env status on startup
console.log('[ENV] SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ set' : '❌ MISSING');
console.log('[ENV] SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ set' : '❌ MISSING');
console.log('[ENV] JWT_SECRET:', process.env.JWT_SECRET ? '✅ set' : '❌ MISSING');
console.log('[ENV] ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS || '❌ MISSING');

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
app.use('/api/blocks', require('./routes/blocks'));

app.get('/health', (_, res) => res.json({ 
  status: 'ok', 
  service: 'binder-api',
  env: {
    supabase: !!process.env.SUPABASE_URL,
    jwt: !!process.env.JWT_SECRET,
  }
}));

setupWebSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Binder API running on port ${PORT}`));
