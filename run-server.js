import { PeerServer } from 'peer';

const port = 9000;

console.log(`Starting PeerServer on port ${port}...`);

const peerServer = PeerServer({
    port: port,
    path: '/myapp',
    allow_discovery: true,
});

peerServer.on('connection', (client) => {
    console.log(`Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`Client disconnected: ${client.getId()}`);
});

console.log(`PeerServer running on http://localhost:${port}/myapp`);
