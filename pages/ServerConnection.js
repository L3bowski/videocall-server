import PeerConnectionService from './PeerConnectionService.js';
import WebSocketConnection from './WebSocketConnection.js';

export default class ServerConnection {

	constructor(webSocketUrl, callbacks) {
		this.callStarted = false;
		this.callbacks = callbacks;
		this.peerConnection = new RTCPeerConnection();
		this.webSocketConnection = new WebSocketConnection(webSocketUrl, message => {
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
		        	this.peerConnection.addIceCandidate(data.candidate);
		        	break;

		        case 'offer':
		            // IIFE lamda to synchronously exectue asynchronous functions
            		(async () => {
            			await this.peerConnection.setRemoteDescription(data.offer);
			            let answer = await this.peerConnection.createAnswer();
			            await this.peerConnection.setLocalDescription(answer);
		        		this.callbacks.callEstablished();
			            this.webSocketConnection.sendMessage({
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
            			await this.peerConnection.setRemoteDescription(data.answer);
            		})();
		        	break;
            }
        });
	}

    register(username) {
        this.webSocketConnection.sendMessage({
            operationType: 'register',
        	username
        });
    }

    requestCall(senderId, receiverId) {
		PeerConnectionService.setUp(this.peerConnection,
			this.webSocketConnection.sendMessage.bind(this.webSocketConnection), senderId, receiverId);
		this.webSocketConnection.sendMessage({
            operationType: 'requestCall',
        	receiverId,
        	senderId
        });
    }

    acceptCall(initiatorId, userId) {
		PeerConnectionService.setUp(this.peerConnection,
			this.webSocketConnection.sendMessage.bind(this.webSocketConnection), userId, initiatorId);
		this.webSocketConnection.sendMessage({
            operationType: 'acceptCall',
        	receiverId: initiatorId,
        	senderId: userId
        });
    }

    async call(senderId, receiverId) {
    	this.callStarted = true;
    	await PeerConnectionService.call(this.peerConnection,
    		this.webSocketConnection.sendMessage.bind(this.webSocketConnection), senderId, receiverId);
    }
}