import PeerConnectionService from './PeerConnectionService.js';

export default class ServerConnection {

	constructor(webSocketUrl, callbacks) {
		this.callbacks = callbacks;
		this.webSocketConnection = new WebSocket(webSocketUrl);
		this.initializeWebSocketConnection();
		this.peerConnection = new RTCPeerConnection();
		this.callStarted = false;
	}

	initializeWebSocketConnection() {
		this.webSocketConnection.onopen = () => {

			async function ice(data) {
	            this.peerConnection.addIceCandidate(data.candidate);
			}

			async function offer(data) {
				await this.peerConnection.setRemoteDescription(data.offer);
	            let answer = await this.peerConnection.createAnswer();
	            await this.peerConnection.setLocalDescription(answer);
        		this.callbacks.callEstablished();
	            this.sendMessage({
	                operationType: 'answer',
	                senderId: data.receiverId,
	                receiverId: data.senderId,
	                answer
	            });
				if (!this.callStarted) {
	            	await this.call(data.receiverId, data.senderId)
	            }
			}

			async function answer(data) {
	            await this.peerConnection.setRemoteDescription(data.answer);
			}

	        this.webSocketConnection.onmessage = message => {
	            let data = JSON.parse(message.data);
	            switch (data.operationType) {
					case 'userRegistered':
			        	this.callbacks.userRegistered(data.user);
			        	break;

			        case 'getUsers':
			        	this.callbacks.usersUpdated(data.otherClients);
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
			        	ice.bind(this)(data);
			        	break;

			        case 'offer':
			            offer.bind(this)(data);
			            break;

			        case 'answer':
			        	answer.bind(this)(data);
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

    getUsers(userId) {
		this.sendMessage({
            operationType: 'getUsers',
        	userId
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