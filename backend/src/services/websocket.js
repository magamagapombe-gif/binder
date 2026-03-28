const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

const clients = new Map(); // userId -> ws

function sendTo(userId, payload) {
  const ws = clients.get(userId);
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

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

        // ── Chat message ──────────────────────────────────────────────────────
        if (msg.type === 'message') {
          const { match_id, content, media_url, msg_type = 'text' } = msg;
          const { data: saved } = await supabase.from('messages').insert({
            id: uuidv4(), match_id, sender_id: user.id,
            content, media_url, type: msg_type, created_at: new Date(),
          }).select().single();
          const { data: match } = await supabase.from('matches').select('*').eq('id', match_id).single();
          const partnerId = match?.user1_id === user.id ? match?.user2_id : match?.user1_id;
          const payload = { type: 'message', data: saved };
          ws.send(JSON.stringify(payload));
          sendTo(partnerId, payload);
        }

        // ── Typing indicator ──────────────────────────────────────────────────
        if (msg.type === 'typing') {
          const { match_id } = msg;
          const { data: match } = await supabase.from('matches').select('*').eq('id', match_id).single();
          const partnerId = match?.user1_id === user.id ? match?.user2_id : match?.user1_id;
          sendTo(partnerId, { type: 'typing', from: user.id });
        }

        // ── Call invite (caller sends to callee — WhatsApp style) ─────────────
        if (msg.type === 'call_invite') {
          const { match_id, room_id, is_video, caller_name, caller_photo } = msg;
          const { data: match } = await supabase.from('matches').select('*').eq('id', match_id).single();
          const partnerId = match?.user1_id === user.id ? match?.user2_id : match?.user1_id;
          sendTo(partnerId, {
            type: 'call_invite',
            match_id, room_id, is_video,
            caller_id: user.id, caller_name, caller_photo,
          });
        }

        // ── Callee accepted the call ──────────────────────────────────────────
        if (msg.type === 'call_accept') {
          const { room_id, caller_id } = msg;
          sendTo(caller_id, { type: 'call_accept', room_id, accepter_id: user.id });
        }

        // ── Callee rejected the call ──────────────────────────────────────────
        if (msg.type === 'call_reject') {
          const { room_id, caller_id } = msg;
          sendTo(caller_id, { type: 'call_reject', room_id });
        }

        // ── Either side ended / cancelled ─────────────────────────────────────
        if (msg.type === 'call_end') {
          const { match_id, room_id } = msg;
          const { data: match } = await supabase.from('matches').select('*').eq('id', match_id).single();
          const partnerId = match?.user1_id === user.id ? match?.user2_id : match?.user1_id;
          sendTo(partnerId, { type: 'call_end', room_id });
        }

      } catch (e) {
        console.error('WS message error:', e);
      }
    });

    ws.on('close', () => {
      clients.delete(user.id);
      console.log(`WS disconnected: ${user.id}`);
    });

    ws.send(JSON.stringify({ type: 'connected', userId: user.id }));
  });
}

module.exports = { setupWebSocket };
