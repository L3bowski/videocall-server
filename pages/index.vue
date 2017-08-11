<template>
    <div>
        <p>Local id: {{peerConnection.senderId}}</p>
        <input v-model="receiverId" placeholder="Receiver id"/>
        <button v-on:click="onCall" id="call-button">call</button>
        <div id="video-wrapper" class="video-wrapper">
            <div class="thumbnail"></div>
        </div>
    </div>
</template>

<script lang="js">
    import PeerConnection from './PeerConnection.js';

    export default {
        data: () => ({
            receiverId: null,
            peerConnection: {}
        }),
        methods: {
            async onCall() {
                await this.peerConnection.call(this.receiverId);
            }
        },
        async mounted() {
            this.peerConnection = new PeerConnection('ws://localhost:8080', this.senderId, this.receiverId);
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
