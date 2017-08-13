export default class PeerConnection {

	constructor(webSocketUrl, callbacks) {
		this.user = {};
		this.channel = null;
		this.callbacks = callbacks;
		this.peerConnection = new RTCPeerConnection();
		this.webSocketConnection = new WebSocket(webSocketUrl);
		
		this.initializePeerConnection();
		this.initializeWebSocketConnection();
	}

	initializePeerConnection() {
		this.peerConnection.onicecandidate = event => {
	        if (event.candidate) {
	            this.sendMessage({
	                operationType: 'ice',
	                candidate: event.candidate,
	                senderId: this.user.id,
	                receiverId: this.receiverId
	            });
	        }
	    };

	    this.peerConnection.ondatachannel = event => {
	        let onChannelReady = () => {
	            this.channel = event.channel;
	            this.channel.send('foo');
	        };

	        if (event.channel.readyState !== 'open') {
	            event.channel.onopen = onChannelReady;
	        }
	        else {
	            onChannelReady();
	        }
	    };

	    this.peerConnection.onaddstream = event => {
	        let videoWrapper = document.getElementById('video-wrapper');
	        videoWrapper.innerHTML = '';
	        let video = document.createElement('video');
	        videoWrapper.appendChild(video);
	        video.src = window.URL.createObjectURL(event.stream);
	        video.play();
	        this.callbacks.callEstablished();
	    };
	}

	initializeWebSocketConnection() {
		this.webSocketConnection.onopen = () => {

			async function offer(data) {
				await this.peerConnection.setRemoteDescription(data.offer);
	            let answer = await this.peerConnection.createAnswer();
	            await this.peerConnection.setLocalDescription(answer);
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

			async function ice(data) {
	            this.peerConnection.addIceCandidate(data.candidate);
	            // If we still haven't make an offer, we should send the offer
	            // BE AWARE! THIS CALL IS RECURSIVE
	             await this.call(data.receiverId, data.senderId)
			}

	        this.webSocketConnection.onmessage = message => {
	            let data = JSON.parse(message.data);
	            switch (data.operationType) {
					case 'register':
			        	this.user = {
			        		id: data.id,
			        		username: data.username
			        	};
			        	this.callbacks.userRegistered(this.user);
			        	break;

			        case 'getUsers':
			        	this.callbacks.usersUpdated(data.otherClients);
			        	break;

			        case 'requestCall':
			        	this.callbacks.callRequested(data);
			        	break;

			        case 'offer':
			            offer.bind(this)(data);
			            break;

			        case 'answer':
			        	answer.bind(this)(data);
			        	break;

			        case 'ice':
			        	ice.bind(this)(data);
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
    	this.receiverId = receiverId;
    	let stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
        this.peerConnection.addStream(stream);
        this.channel = this.peerConnection.createDataChannel('foo');
        let offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        this.sendMessage({
            operationType: 'offer',
            senderId,
            receiverId,
            offer
        });
    }
}