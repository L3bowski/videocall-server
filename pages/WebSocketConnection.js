export default class WebSocketConnection {

	constructor(webSocketUrl, onmessageCallback) {
		this.webSocketConnection = new WebSocket(webSocketUrl);
		this.webSocketConnection.onopen = () => {
	        this.webSocketConnection.onmessage = onmessageCallback;
	    };
	}

	sendMessage(data) {
        this.webSocketConnection.send(JSON.stringify(data));
    }
}