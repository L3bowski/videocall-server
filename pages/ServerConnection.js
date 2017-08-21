import PeerConnectionService from './PeerConnectionService.js';

export default class ServerConnection {

	constructor(webSocketUrl, callbacks) {
		this.callbacks = callbacks;
		this.webSocketConnection = new WebSocket(webSocketUrl);
		this.peerConnection = new RTCPeerConnection();
		this.initializeWebSocketConnection(this.webSocketConnection, this.peerConnection);
		this.callStarted = false;
	}

	initializeWebSocketConnection(webSocketConnection, peerConnection) {
		webSocketConnection.onopen = () => {

	        webSocketConnection.onmessage = message => {
	            let data = JSON.parse(message.data);
	            switch (data.operationType) {
					case 'userRegistered':
			        	this.callbacks.userRegistered(data.user, data.otherUsers);
			        	break;

			        case 'otherUserRegistered':
			        	this.callbacks.otherUserRegistered(data.user);
			        	break;

			        case 'requestCall':
			        	this.callbacks.callRequested(data);
			        	break;

			        case 'acceptCall':
			        	this.callbacks.callAccepted(data);
			        	break;

			        case 'ice':
			        	peerConnection.addIceCandidate(data.candidate);
			        	break;

			        case 'offer':
			            // IIFE lamda to synchronously exectue asynchronous functions
	            		(async () => {
	            			await peerConnection.setRemoteDescription(data.offer);
				            let answer = await peerConnection.createAnswer();
				            await peerConnection.setLocalDescription(answer);
			        		this.callbacks.callEstablished();
				            this.sendMessage({
				                operationType: 'answer',
				                senderId: data.receiverId,
				                receiverId: data.senderId,
				                answer
				            });
							if (!this.callStarted) {
				            	await this.call(data.receiverId, data.senderId);
				            }
	            		})();
			            break;

			        case 'answer':
			        	// IIFE lamda to synchronously exectue an asynchronous functions
	            		(async () => {
	            			await peerConnection.setRemoteDescription(data.answer);
	            		})();
			        	break;
	            }
	        };

	    };
	}

	sendMessage(data) {
        this.webSocketConnection.send(JSON.stringify(data));
    }

    register(username) {
        this.sendMessage({
            operationType: 'register',
        	username
        });
    }

    requestCall(senderId, receiverId) {
		PeerConnectionService.setUp(this.peerConnection, this.sendMessage.bind(this), senderId, receiverId);
		this.sendMessage({
            operationType: 'requestCall',
        	receiverId,
        	senderId
        });
    }

    acceptCall(initiatorId, userId) {
		PeerConnectionService.setUp(this.peerConnection, this.sendMessage.bind(this), userId, initiatorId);
		this.sendMessage({
            operationType: 'acceptCall',
        	receiverId: initiatorId,
        	senderId: userId
        });
    }

    async call(senderId, receiverId) {
    	this.callStarted = true;
    	await PeerConnectionService.call(this.peerConnection, this.sendMessage.bind(this), senderId, receiverId);
    }
}