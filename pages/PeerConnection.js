export default class PeerConnection {

	constructor(webSocketUrl) {
		this.senderId = null;
		this.receiverId = null;
		this.eventHandlers = {};
		this.channel = null;

		this.peerConnection = new RTCPeerConnection();
		this.initializePeerConnection();

		this.webSocketConnection = new WebSocket(webSocketUrl);
		this.initializeWebSocketConnection();
	}

	initializePeerConnection() {
		this.peerConnection.onicecandidate = event => {
	        if (event.candidate) {
	            this.sendMessage({
	                request: 'ice',
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
	            if (this.eventHandlers[data.request]) {
	            	this.eventHandlers[data.request](data);
	            }
	        });

	        this.eventHandlers['register'] = (message => this.senderId = message.id);
	        this.eventHandlers['offer'] = (async message => {
	            await this.peerConnection.setRemoteDescription(message.offer);
	            let answer = await this.peerConnection.createAnswer();
	            await this.peerConnection.setLocalDescription(answer);
	            this.sendMessage({
	                request: 'answer',
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

	        this.sendMessage({
	            request: 'register'
	        });
	    };
	}

	sendMessage(data) {
        this.webSocketConnection.send(JSON.stringify({
            receiverId: this.receiverId,
            senderId: this.senderId,
            ...data
        }));
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
            request: 'offer',
            offer
        });
    }
}