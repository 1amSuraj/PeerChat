let APP_ID = "00891cd1c3e04eb1bddac3e4d57f0fc8"

let token = null;
let uid = String(Math.floor(Math.random() * 10000))

let client;
let channel;

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')

if (!roomId) {
    roomId = prompt("Please enter a room ID:")
    if (!roomId) {
        alert("Room ID is required to join a room.")
        window.location = 'lobby.html'
    } else {
        window.location.search = `?room=${roomId}`
    }
}

let localTracks = {
    videoTrack: null,
    audioTrack: null
};
let remoteUsers = {};

let init = async () => {
    try {
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        await client.join(APP_ID, roomId, token, uid);

        [localTracks.audioTrack, localTracks.videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

        let player = `<div id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                      </div>`;
        document.getElementById('videos').insertAdjacentHTML('beforeend', player);
        localTracks.videoTrack.play(`user-${uid}`);

        await client.publish(Object.values(localTracks));

        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);

        console.log('Local stream initialized and assigned to video element');
    } catch (error) {
        console.error('Error initializing local stream:', error);
    }
}

let handleUserPublished = async (user, mediaType) => {
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null) {
            player.remove();
        }

        player = `<div id="user-container-${user.uid}">
                    <div class="video-player" id="user-${user.uid}"></div>
                  </div>`;
        document.getElementById('videos').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}

let handleUserUnpublished = (user) => {
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player != null) {
        player.remove();
    }
}

let leaveChannel = async () => {
    for (trackName in localTracks) {
        let track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            localTracks[trackName] = null;
        }
    }

    await client.leave();
    document.getElementById('videos').innerHTML = '';
    console.log("Leave channel successfully");
}

let toggleCamera = async () => {
    if (localTracks.videoTrack.muted) {
        await localTracks.videoTrack.setMuted(false);
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)';
    } else {
        await localTracks.videoTrack.setMuted(true);
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)';
    }
}

let toggleMic = async () => {
    if (localTracks.audioTrack.muted) {
        await localTracks.audioTrack.setMuted(false);
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)';
    } else {
        await localTracks.audioTrack.setMuted(true);
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)';
    }
}

window.addEventListener('beforeunload', leaveChannel);

document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleMic);

init();