export default async function(serverConnection, senderId, receiverId) {

    serverConnection.peerConnection.onaddstream = event => {
        let videoWrapper = document.getElementById('video-wrapper');
        videoWrapper.innerHTML = '';
        let video = document.createElement('video');
        videoWrapper.appendChild(video);
        video.src = window.URL.createObjectURL(event.stream);
        video.play();
    };

    /*An stream from the current browser webcam is created and added to the peerConnection*/
    let stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    serverConnection.peerConnection.addStream(stream);




    serverConnection.peerConnection.ondatachannel = event => {
        let onChannelReady = () => {
            serverConnection.channel = event.channel;
        };

        if (event.channel.readyState !== 'open') {
            event.channel.onopen = onChannelReady;
        }
        else {
            onChannelReady();
        }
    };

    serverConnection.channel = serverConnection.peerConnection.createDataChannel('channelIdentificator');




    let offer = await serverConnection.peerConnection.createOffer();
	serverConnection.peerConnection.onicecandidate = event => {
        if (event.candidate) {
            serverConnection.sendMessage({
                operationType: 'ice',
                candidate: event.candidate,
                senderId,
                receiverId
            });
        }
    };
    /*The following operation will create many ice candidates */
    await serverConnection.peerConnection.setLocalDescription(offer);

    serverConnection.sendMessage({
        operationType: 'offer',
        senderId,
        receiverId,
        offer
    });
}