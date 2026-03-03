const WebSocket = require('ws');

const token = process.argv[2];
const tenantId = process.argv[3];

const ws = new WebSocket(`ws://localhost:4000/socket?token=${token}&tenant_id=${tenantId}`);

ws.on('open', () => {
  console.log('✅ WebSocket conectado!');
  ws.send(JSON.stringify({ event: 'phx_join', payload: { channel_id: 'test' } }));
  setTimeout(() => ws.close(), 2000);
});

ws.on('message', (data) => {
  console.log('📩 Mensagem:', data.toString());
});

ws.on('error', (err) => {
  console.log('❌ Erro:', err.message);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
});
