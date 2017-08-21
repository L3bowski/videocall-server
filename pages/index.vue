<template>
    <div>

        <div v-if="user.id == null">
            <p>Choose your username</p>
            <input v-model="user.name"/>
            <button v-if="user.name != null" v-on:click="register" id="register-button">Register</button>
        </div>

        <div v-if="user.id != null">
            <p>Choose some one to call to:</p>
            <p v-if="otherUsers.length == 0">Seems that there is no one registered yet...</p>
            <div v-if="otherUsers.length > 0">
                <select v-model="selectedUser">
                    <option disabled value="">Please select one</option>
                    <option v-for="user in otherUsers" v-bind:value="user" >{{ user.username }}</option>
                </select>
                <button v-if="selectedUser != null" v-on:click="requestCall">Call</button>
            </div>
        </div>

        <div v-if="promptAcceptCall">
            <p>Do you want to accept the incoming call?</p>
            TODO: Display the caller name
            <button v-on:click="acceptCall">Yes</button>
            TODO: Add 'No' option
        </div>

        <div id="video-wrapper" class="video-wrapper">
            <div class="thumbnail"></div>
        </div>

    </div>
</template>

<script lang="js">
    import ServerConnection from './ServerConnection.js';

    export default {
        data: () => ({
            user: {
                id: null,
                name: null
            },
            otherUsers: [],
            selectedUser: null,
            promptAcceptCall: false,
            calleeId: null
        }),
        methods: {
            register() {
                this.serverConnection.register(this.user.name);
            },
            userRegistered(user) {
                this.user = user;
                this.serverConnection.getUsers(user.id);
            },
            usersUpdated(registeredUsers) {
                this.otherUsers = registeredUsers;
            },
            requestCall() {
                this.serverConnection.requestCall(this.user.id, this.selectedUser.id);
            },
            callRequested(data) {
                this.calleeId = data.senderId;
                this.promptAcceptCall = true;
            },
            async acceptCall() {
                this.serverConnection.acceptCall(this.calleeId, this.user.id);
            },
            async callAccepted() {
                await this.serverConnection.call(this.user.id, this.selectedUser.id, true);
            },
            callEstablished() {
            }
        },
        async mounted() {
            this.serverConnection = new ServerConnection('ws://localhost:20000', {
                userRegistered: this.userRegistered.bind(this),
                usersUpdated: this.usersUpdated.bind(this),
                callRequested: this.callRequested.bind(this),
                callAccepted: this.callAccepted.bind(this),
                callEstablished: this.callEstablished.bind(this)
            });
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
