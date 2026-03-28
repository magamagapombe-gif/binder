const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

const clients = new Map(); // userId -> ws

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      ws.close(1008, 'Unauthorized');
      return;
    }

    clients.set(user.id, ws);
    console.log(`WS connected: ${user.id}`);

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'message') {
          const { match_id, content, media_url, msg_type = 'text' } = msg;

          const { data: saved } = await supabase.from('messages').insert({
            id: uuidv4(), match_id, sender_id: user.id,
            content, media_url, type: msg_type, created_at: new Date(),
          }).select().single();

          // Get partner id
          const { data: match } = await supabase.from('matches').select('*').eq('id', match_id).single();
          const partnerId = match?.user1_id === user.id ? match?.user2_id : match?.user1_id;

          const payload = JSON.stringify({ type: 'message', data: saved });
          ws.send(payload);
          const partnerWs = clients.get(partnerId);
          if (partnerWs?.readyState === WebSocket.OPEN) partnerWs.send(payload);
        }

        if (msg.type === 'typing') {
          const { match_id } = msg;
          const { data: match } = await supabase.from('matches').select('*').eq('id', match_id).single();
          const partnerId = match?.user1_id === user.id ? match?.user2_id : match?.user1_id;
          const partnerWs = clients.get(partnerId);
          if (partnerWs?.readyState === WebSocket.OPEN) {
            partnerWs.send(JSON.stringify({ type: 'typing', from: user.id }));
          }
        }
      } catch (e) {
        console.error('WS message error:', e);
      }
    });

    ws.on('close', () => clients.delete(user.id));
    ws.send(JSON.stringify({ type: 'connected', userId: user.id }));
  });
}

module.exports = { setupWebSocket };
