<template>
    <div>
        <p>Local id: {{senderId}}</p>
        <input v-model="receiverId" placeholder="Receiver id"/>
        <button v-on:click="onCall">call</button>
        <div id="video-wrapper" class="video-wrapper">
            <div class="thumbnail"></div>
        </div>
    </div>
</template>

<script lang="js">
    export default {
        data: () => ({
            senderId: null,
            receiverId: null,
            connection: null,
            peerConnection: null,
            channel: null,
            eventHandlers: {}
        }),
        methods: {
            defineEventHanlder(request, handler) {
                this.eventHandlers[request] = handler;
            },
            sendMessage(data) {
                this.connection.send(JSON.stringify({
                    receiverId: this.receiverId,
                    senderId: this.senderId,
                    ...data
                }));
            },
            async onCall() {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
                this.peerConnection.addStream(stream);
                this.channel = this.peerConnection.createDataChannel('foo');
                this.channel.onmessage = message => {
                    console.log(`data received: ${message.data}`);
                };
                const offer = await this.peerConnection.createOffer();
                await this.peerConnection.setLocalDescription(offer);
                console.log("sending offer...");
                this.sendMessage({
                    request: 'offer',
                    offer
                });
            }
        },
        async mounted() {
            this.peerConnection = new RTCPeerConnection();
            this.peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    this.sendMessage({
                        request: 'ice',
                        candidate: event.candidate
                    });
                }
            };
            this.peerConnection.ondatachannel = event => {
                const onChannelReady = () => {
                    console.log('channel attached');
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
                const video = document.createElement('video');
                videoWrapper.appendChild(video);
                video.src = window.URL.createObjectURL(event.stream);
                video.play();
            };
            this.connection = new WebSocket('ws://localhost:8080');
            this.connection.onopen = () => {
                this.connection.onmessage = (message) => {
                    const data = JSON.parse(message.data);
                    if (this.eventHandlers[data.request]) this.eventHandlers[data.request](data);
                };
                this.defineEventHanlder('register', message => this.senderId = message.id);
                this.defineEventHanlder('offer', async (message) => {
                    await this.peerConnection.setRemoteDescription(message.offer);
                    const answer = await this.peerConnection.createAnswer();
                    await this.peerConnection.setLocalDescription(answer);
                    this.sendMessage({
                        request: 'answer',
                        receiverId: message.senderId, answer
                    });
                });
                this.defineEventHanlder('answer', async (message) => {
                    await this.peerConnection.setRemoteDescription(message.answer);
                });
                this.defineEventHanlder('ice', (message) => {
                    this.peerConnection.addIceCandidate(message.candidate);
                });
                this.sendMessage({
                    request: 'register'
                });
            };
        }
    }
</script>

<style scoped>
    .thumbnail {
        width: 640px;
        height: 480px;
        background-color: lightgrey;
    }
</style>
