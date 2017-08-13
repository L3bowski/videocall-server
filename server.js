const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const WebSocket = require('ws');
const webSocket = new WebSocket.Server({server});
const clients = require('./clients');

webSocket.on('connection', function connection(clientWebSocket) {

    clientWebSocket.on('message', message => {

        const data = JSON.parse(message);

        switch (data.operationType) {
            case 'register':
                var client = clients.register(clientWebSocket, data.username);
                clientWebSocket.send(JSON.stringify({
                    operationType: 'register',
                    id: client.id,
                    username: client.username
                }));
                break;
            case 'getUsers':
                var client = clients.get(data.userId);
                var otherClients = clients.getList(data.userId);
                client.clientWebSocket.send(JSON.stringify({
                    operationType: 'getUsers',
                    otherClients
                }));
                break;
            default:
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
