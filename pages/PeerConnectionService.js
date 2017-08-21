export default {
    setUp: function(peerConnection, sendMessage, senderId, receiverId) {

        peerConnection.onaddstream = function(event) {
            let videoWrapper = document.getElementById('video-wrapper');
            videoWrapper.innerHTML = '';
            let video = document.createElement('video');
            videoWrapper.appendChild(video);
            video.src = window.URL.createObjectURL(event.stream);
            video.play();
        };

        peerConnection.onicecandidate = function(event) {
            if (event.candidate) {
                sendMessage({
                    operationType: 'ice',
                    candidate: event.candidate,
                    senderId,
                    receiverId
                });
            }
        };

    },
    call: async function(peerConnection, sendMessage, senderId, receiverId) {

        /*An stream from the current browser webcam is created and added to the peerConnection*/
        let stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
        peerConnection.addStream(stream);

        let offer = await peerConnection.createOffer();
        /*The following operation will create many ice candidates */
        await peerConnection.setLocalDescription(offer);

        sendMessage({
            operationType: 'offer',
            senderId,
            receiverId,
            offer
        });
    }
};
