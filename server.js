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
                var otherClients = clients.getList(client.id);
                var userResponse = (user) => {
                    return {
                        id: user.id,
                        name: user.name
                    };
                };

                clientWebSocket.send(JSON.stringify({
                    operationType: 'userRegistered',
                    user: userResponse(client),
                    otherUsers: otherClients.map(userResponse)
                }));

                otherClients.forEach(otherClient => {
                    otherClient.clientWebSocket.send(JSON.stringify({
                        operationType: 'otherUserRegistered',
                        user: userResponse(client)
                    }));
                });
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

server.listen(20000);
