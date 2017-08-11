var currentId = 0;
var registeredClients = {};

module.exports = {
    get: function(id) {
        if (!id) return;
        return registeredClients[id];
    },
    register: function(clientWebSocket) {
        let nextId = ++currentId;
        var client = registeredClients[nextId] = {
            id: nextId,
            clientWebSocket
        };
        return client;
    },
    remove: function(clientWebSocket) {
        const clientId = Object.keys(registeredClients).find(key => {
            return registeredClients[key].clientWebSocket === clientWebSocket;
        });
        delete registeredClients[clientId];
    }
};