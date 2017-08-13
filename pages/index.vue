<template>
    <div>

        <input v-model="username" placeholder="Choose your username"/>
        <button v-on:click="register" id="register-button">Register</button>

        <select v-model="receiver">
            <option disabled value="">Please select one</option>
            <option v-for="user in users" v-bind:value="user.id" >{{ user.username }}</option>
        </select>
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
            username: null,
            users: [],
            receiver: {},
            peerConnection: {}
        }),
        methods: {
            register() {
                this.peerConnection.register(this.username);
            },
            usersUpdated(registeredUsers) {
                console.log(registeredUsers)
                this.users = registeredUsers;
            },
            async onCall() {
                await this.peerConnection.call(this.receiver);
            }
        },
        async mounted() {
            this.peerConnection = new PeerConnection('ws://localhost:8080', this.usersUpdated.bind(this));
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
