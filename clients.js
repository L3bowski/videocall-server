var currentId = 0;
var registeredClients = [];

module.exports = {
    get: function(id) {
        if (!id) {
            return null;
        }
        return registeredClients[id];
    },
    getList: function(id) {
        return registeredClients
        .filter(client => client.id != id)
        .map(client => {
            return {
                id: client.id,
                username: client.username
            };
        });
    },
    register: function(clientWebSocket, username) {
        let nextId = ++currentId;
        var client = registeredClients[nextId] = {
            id: nextId,
            username,
            clientWebSocket
        };
        return client;
    },
    remove: function(clientWebSocket) {
        const client = registeredClients.find(client => client && client.clientWebSocket === clientWebSocket);
        client && delete registeredClients[client.id];
    }
};