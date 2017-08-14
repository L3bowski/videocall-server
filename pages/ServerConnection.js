import PeerConnectionConfig from './PeerConnectionConfig.js';

export default class ServerConnection {

	constructor(webSocketUrl, callbacks) {
		this.callbacks = callbacks;
		this.webSocketConnection = new WebSocket(webSocketUrl);
		this.initializeWebSocketConnection();
		this.peerConnection = new RTCPeerConnection();
		this.callOnProgress = false;
	}

	initializeWebSocketConnection() {
		this.webSocketConnection.onopen = () => {

			async function ice(data) {
	            this.peerConnection.addIceCandidate(data.candidate);
            	await this.call(data.receiverId, data.senderId)
				/*if (!this.callOnProgress) {
	            	this.callOnProgress = true;
	            }*/
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
			}

			async function answer(data) {
	            await this.peerConnection.setRemoteDescription(data.answer);
			}

	        this.webSocketConnection.onmessage = message => {
	            let data = JSON.parse(message.data);
	            switch (data.operationType) {
					case 'register':
			        	this.callbacks.userRegistered({
			        		id: data.id,
			        		username: data.username
			        	});
			        	break;

			        case 'getUsers':
			        	this.callbacks.usersUpdated(data.otherClients);
			        	break;

			        case 'requestCall':
			        	this.callbacks.callRequested(data);
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
		this.sendMessage({
            operationType: 'requestCall',
        	receiverId,
        	senderId
        });
    }

    async call(senderId, receiverId) {
    	this.callOnProgress = true;
    	await PeerConnectionConfig(this, senderId, receiverId);
    }
}