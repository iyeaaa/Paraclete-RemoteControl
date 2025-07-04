const socket = io();
const configuration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
    ],
};

const url = new URL(window.location.href);
const params = url.searchParams;
const room = params.get("room");

const screenVideo = document.getElementById("screen-share-video");
// const remoteVideo = document.getElementById("remote-video"); // 삭제

const startShareButton = document.getElementById("startShareBtn");
const stopShareButton = document.getElementById("stopShareBtn");
const screenCropBtn = document.getElementById("screenCropBtn");

let screenStream;
let peerConnection;
let isRoomJoined = false;

let slider = [0, 0, 0, 0, 0];
const worker = new Worker("./js/cropworker.js", { name: 'Crop worker' });

if (!room) {
    alert("Room ID is missing. URL에 ?room=ROOM_NAME 형식으로 방 이름을 지정해주세요.");
    window.location.href = "/";
} else {
    socket.emit("join_room", { roomName: room, role: "receiver" });
    console.log(`Receiver: Attempting to join room: ${room} as receiver`);
}

socket.on("receiver_room_joined", ({ roomName }) => {
    console.log(`Receiver: Successfully joined room ${roomName}. Ready to share screen.`);
    isRoomJoined = true;
    startShareButton.disabled = false;
    stopShareButton.disabled = true;
    screenCropBtn.disabled = true;
});

socket.on("join_error", (message) => {
    console.error(`Receiver: Failed to join room - ${message}`);
    alert(`방 참여 실패: ${message}`);
    isRoomJoined = false;
    startShareButton.disabled = true;
    stopShareButton.disabled = true;
    screenCropBtn.disabled = true;
});

function updateValue(sliderNumber, value) {
    document.getElementById("value" + sliderNumber).innerText = value;
    slider[sliderNumber] = value;
}

function applySliderValues() {
    if (!screenStream) return;
    const top = slider[1] || 0;
    const bottom = slider[2] || 0;
    const left = slider[3] || 0;
    const right = slider[4] || 0;
    console.log("Receiver: Cropping values applied:", { top, bottom, left, right });
    croppingScreen(top, bottom, left, right);
}

screenCropBtn.addEventListener('click', function () {
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        sliderContainer.style.display = (sliderContainer.style.display === 'none' || sliderContainer.style.display === '')
            ? 'flex'
            : 'none';
    }
});

async function getScreenAndCreateOffer() {
    if (!isRoomJoined) {
        alert("아직 방에 정상적으로 참여하지 않았습니다.");
        return;
    }
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: "window", frameRate: { ideal: 15, max: 30 } },
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });

        screenVideo.srcObject = screenStream;
        startShareButton.disabled = true;
        stopShareButton.disabled = false;
        screenCropBtn.disabled = false;
        console.log("Receiver: Screen share started.");

        if (!peerConnection || peerConnection.signalingState !== "stable") {
            console.warn("Receiver: PeerConnection not ready or not stable for offer. Creating/Recreating.");
            if(peerConnection) peerConnection.close();
            makeConnection();
        }

        const senders = peerConnection.getSenders();
        senders.forEach(sender => {
            if (sender.track) {
                try {
                    peerConnection.removeTrack(sender);
                } catch (e) {
                    console.warn("Error removing track during cleanup:", e);
                }
            }
        });


        screenStream.getTracks().forEach(track => {
            try {
                peerConnection.addTrack(track, screenStream);
                console.log(`Receiver: Added screen track: ${track.kind}`);
            } catch (e) {
                console.error("Error adding track:", e);
            }
        });

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, room);
        console.log("Receiver: Sent the offer.");

    } catch (err) {
        console.error("Receiver: Error starting screen share or creating offer:", err);
        alert(`화면 공유 시작 오류: ${err.name} - ${err.message}`);
        stopScreenSharingCleanup();
    }
}

function stopScreenSharingCleanup() {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
    }
    screenVideo.srcObject = null;
    startShareButton.disabled = !isRoomJoined;
    stopShareButton.disabled = true;
    screenCropBtn.disabled = true;
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) sliderContainer.style.display = 'none';
    console.log("Receiver: Screen share UI reset.");
}

function stopScreenSharing() {
    stopScreenSharingCleanup();
    if (peerConnection) {
        socket.emit("bye_signal", room);
        peerConnection.close();
        peerConnection = null;
    }
    console.log("Receiver: Screen share and WebRTC connection stopped.");
}

startShareButton.addEventListener("click", getScreenAndCreateOffer);
stopShareButton.addEventListener("click", stopScreenSharing);

function croppingScreen(top, bottom, left, right) {
    if (!screenStream || screenStream.getVideoTracks().length === 0) {
        console.error("Receiver: No screen stream available for cropping.");
        return;
    }
    if (typeof MediaStreamTrackProcessor === 'undefined' ||
        typeof MediaStreamTrackGenerator === 'undefined') {
        alert('브라우저가 Insertable Streams API를 지원하지 않습니다.');
        return;
    }
    const [originalTrack] = screenStream.getVideoTracks();
    if (!originalTrack) {
        console.error("Receiver: No video track found.");
        return;
    }
    const processor = new MediaStreamTrackProcessor({ track: originalTrack });
    const readable = processor.readable;
    const generator = new MediaStreamTrackGenerator({ kind: 'video' });
    const writable = generator.writable;
    worker.postMessage({
        operation: 'crop', readable, writable, top, bottom, left, right
    }, [readable, writable]);
    if (peerConnection) {
        const videoSender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
            videoSender.replaceTrack(generator).catch(e => console.error('Track replacement failed', e));
        }
    }
}

function makeConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    console.log("Receiver: RTCPeerConnection created.");

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice", event.candidate, room);
        }
    };

    // Receiver는 Controller로부터 미디어를 수신하지 않으므로 ontrack에서 remoteVideo 처리 불필요
    peerConnection.ontrack = (event) => {
        console.log("Receiver: Received remote track (unexpected, as Controller sends no media):", event.track);
        // Controller가 미디어를 보내지 않으므로 이 부분은 호출되지 않거나, 호출되더라도 처리할 UI 요소가 없음
    };
    peerConnection.oniceconnectionstatechange = () => {
        console.log(`Receiver: ICE connection state: ${peerConnection.iceConnectionState}`);
    };
    peerConnection.onconnectionstatechange = () => {
        console.log(`Receiver: Connection state: ${peerConnection.connectionState}`);
        if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
            handleDisconnect("Controller");
        }
    };
}

socket.on("answer", async (answer, senderId) => {
    if (senderId === socket.id) return;
    console.log(`Receiver: Received answer from ${senderId} (Controller)`);
    if (peerConnection && peerConnection.localDescription) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log("Receiver: Set remote description from answer.");
        } catch (e) {
            console.error("Receiver: Error setting remote description from answer:", e);
        }
    }
});

socket.on("ice", async (ice, senderId) => {
    if (senderId === socket.id) return;
    if (peerConnection && peerConnection.signalingState !== "closed") {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(ice));
        } catch (e) {
            // console.error("Receiver: Error adding ICE candidate:", e);
        }
    }
});

socket.on("participant_left", ({ id, role }) => {
    console.log(`Receiver: Participant ${id} (${role}) has left the room.`);
    if (role === "controller") {
        handleDisconnect("Controller");
    }
});

socket.on("controller_left_room", (message) => {
    console.log(`Receiver: ${message}`);
    alert(message);
    isRoomJoined = false;
    stopScreenSharing();
    startShareButton.disabled = true;
});

function handleDisconnect(disconnectedPartyRole) {
    console.log(`Receiver: Handling disconnect (${disconnectedPartyRole} left or connection failed).`);
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    alert(`상대방(${disconnectedPartyRole})과의 연결이 끊어졌거나 종료되었습니다.`);
    if(isRoomJoined){
        startShareButton.disabled = false; // 공유 재시작 가능하도록
        stopShareButton.disabled = true;
        screenCropBtn.disabled = true;
        if (screenStream) { // 만약 로컬 스트림이 여전히 있다면 정리
            stopScreenSharingCleanup();
        }
    }
}

startShareButton.disabled = true;
stopShareButton.disabled = true;
screenCropBtn.disabled = true;
document.querySelector('.slider-container').style.display = 'none';