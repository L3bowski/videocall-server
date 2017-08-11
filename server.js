const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const WebSocket = require('ws');
const webSocket = new WebSocket.Server({server});
const clients = require('./clients');

webSocket.on('connection', function connection(clientWebSocket, request) {

    clientWebSocket.on('message', message => {

        const data = JSON.parse(message);
        
        if (data.request === 'register') {
            var client = clients.register(clientWebSocket);
            clientWebSocket.send(JSON.stringify({
                request: 'register',
                id: client.id
            }));
        }
        else {
            var client = clients.get(data.receiverId);
            if (client) {
                client.clientWebSocket.send(message);
            }
        }
    });

    clientWebSocket.on('close', () => {
        clients.remove(clientWebSocket);
    });
});

server.listen(8080);
