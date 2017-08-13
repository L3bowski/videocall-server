export default class PeerConnection {

	constructor(webSocketUrl, usersUpdated) {
		this.user = {};
		this.receiver = {};
		this.eventHandlers = {};
		this.channel = null;
		this.usersUpdated = usersUpdated;

		this.peerConnection = new RTCPeerConnection();
		this.initializePeerConnection();

		this.webSocketConnection = new WebSocket(webSocketUrl);
		this.initializeWebSocketConnection();
	}

	initializePeerConnection() {
		this.peerConnection.onicecandidate = event => {
	        if (event.candidate) {
	            this.sendMessage({
	                operationType: 'ice',
	                candidate: event.candidate
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
	        document.getElementById('call-button').remove();
	    };
	}

	initializeWebSocketConnection() {
		this.webSocketConnection.onopen = () => {

	        this.webSocketConnection.onmessage = (message => {
	            let data = JSON.parse(message.data);
	            if (this.eventHandlers[data.operationType]) {
	            	this.eventHandlers[data.operationType](data);
	            }
	        });

	        this.eventHandlers['register'] = (message => {
	        	this.user = {
	        		id: message.id,
	        		username: message.username
	        	};
	        	this.sendMessage({
		            operationType: 'get-users',
		        	userId: this.user.id
		        });
	        });
	        this.eventHandlers['get-users'] = (message => {
	        	this.usersUpdated(message.otherClients);
	        });
	        this.eventHandlers['offer'] = (async message => {
	            await this.peerConnection.setRemoteDescription(message.offer);
	            let answer = await this.peerConnection.createAnswer();
	            await this.peerConnection.setLocalDescription(answer);
	            this.sendMessage({
	                operationType: 'answer',
	                receiverId: message.senderId,
	                answer
	            });
	        });
	        this.eventHandlers['answer'] = (async message => {
	            await this.peerConnection.setRemoteDescription(message.answer);
	        });
	        this.eventHandlers['ice'] = (async message => {
	            this.peerConnection.addIceCandidate(message.candidate);
	            // If we still haven't make an offer, we should send the offer
	            await this.call(message.senderId)
	        });
	    };
	}

	sendMessage(data) {
        this.webSocketConnection.send(JSON.stringify({
            receiverId: this.receiverId,
            senderId: this.user.id,
            ...data
        }));
    }

    register(username) {
        this.sendMessage({
            operationType: 'register',
        	username
        });
    }

    async call(receiverId) {
    	this.receiverId = receiverId;
    	let stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
        this.peerConnection.addStream(stream);
        this.channel = this.peerConnection.createDataChannel('foo');
        this.channel.onmessage = message => {
            console.log(`data received: ${message.data}`);
        };
        let offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        console.log("sending offer...");
        this.sendMessage({
            operationType: 'offer',
            offer
        });
    }
}