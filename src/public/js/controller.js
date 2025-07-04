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
let peerConnection;

if (!room) {
    alert("Room ID is missing. URL에 ?room=ROOM_NAME 형식으로 방 이름을 지정해주세요.");
    window.location.href = "/"; // 홈으로 리디렉션
} else {
    // 역할과 함께 방 참여 요청
    socket.emit("join_room", { roomName: room, role: "controller" });
    console.log(`Controller: Attempting to join room: ${room} as controller`);
}

socket.on("controller_room_joined", ({ roomName }) => {
    console.log(`Controller: Successfully joined room ${roomName}. Waiting for Receiver.`);
    // 여기서 UI에 "리시버 대기 중..." 같은 메시지 표시 가능
});

socket.on("join_error", (message) => {
    console.error(`Controller: Failed to join room - ${message}`);
    alert(`방 참여 실패: ${message}`);
    window.location.href = "/"; // 홈으로 리디렉션
});

socket.on("receiver_connected_to_room", ({ receiverId }) => {
    console.log(`Controller: Receiver ${receiverId} connected. Ready to start WebRTC.`);
    // Receiver가 연결되면 WebRTC 연결 절차 시작 (Offer를 기다림)
    if (!peerConnection) {
        makeConnection(); // Receiver가 연결되면 PeerConnection 준비
    } else {
        // 이미 연결이 있다면 (예: 재연결 시나리오), 필요에 따라 리셋
        console.log("Controller: PeerConnection already exists. May need to renegotiate if Receiver reconnected.");
    }
});


function makeConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    console.log("Controller: RTCPeerConnection created.");

    peerConnection.onicecandidate = (event) => { // onicecandidate 사용 권장
        if (event.candidate) {
            socket.emit("ice", event.candidate, room);
            // console.log("Controller: Sent ICE candidate:", event.candidate);
        }
    };

    peerConnection.ontrack = (event) => { // ontrack 사용 권장
        console.log("Controller: Received remote track:", event.track, "Stream:", event.streams[0]);
        if (event.streams && event.streams[0]) {
            if (screenVideo.srcObject !== event.streams[0]) {
                screenVideo.srcObject = event.streams[0];
                console.log("Controller: Attached remote stream to screenVideo element.");
            }
        } else {
            if (!screenVideo.srcObject) {
                const remoteStream = new MediaStream();
                remoteStream.addTrack(event.track);
                screenVideo.srcObject = remoteStream;
            } else if (screenVideo.srcObject.getTracks().indexOf(event.track) === -1) {
                screenVideo.srcObject.addTrack(event.track);
            }
        }
    };

    peerConnection.oniceconnectionstatechange = () => { // oniceconnectionstatechange 사용 권장
        console.log(`Controller: ICE connection state: ${peerConnection.iceConnectionState}`);
    };
    peerConnection.onconnectionstatechange = () => { // onconnectionstatechange 사용 권장
        console.log(`Controller: Connection state: ${peerConnection.connectionState}`);
        if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
            handleDisconnect();
        }
    };
}

socket.on("offer", async (offer, senderId) => {
    if (senderId === socket.id) return;
    console.log(`Controller: Received offer from ${senderId} (Receiver)`);

    if (!peerConnection || peerConnection.signalingState !== "stable") {
        // Controller는 Receiver가 연결된 후 offer를 받으므로, 이 시점에 peerConnection이 있어야 함.
        // 만약 없다면 makeConnection() 호출
        console.warn("Controller: PeerConnection not ready or not stable for offer. Creating/Recreating.");
        if(peerConnection) peerConnection.close(); // 기존 것 정리
        makeConnection();
    }

    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("Controller: Set remote description from offer.");
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, room);
        console.log("Controller: Sent the answer.");
    } catch (e) {
        console.error("Controller: Error handling offer or creating answer:", e);
    }
});

socket.on("ice", async (ice, senderId) => {
    if (senderId === socket.id) return;
    // console.log(`Controller: Received ICE candidate from ${senderId} (Receiver)`);
    if (peerConnection && peerConnection.signalingState !== "closed") { // 연결이 닫히지 않았을 때만
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(ice));
            // console.log("Controller: Added received ICE candidate.");
        } catch (e) {
            // console.error("Controller: Error adding received ICE candidate:", e);
        }
    }
});

socket.on("participant_left", ({ id, role }) => {
    console.log(`Controller: Participant ${id} (${role}) has left the room.`);
    if (role === "receiver") {
        handleDisconnect();
    }
});
socket.on("controller_left_room", (message) => { // 자신이 Controller인데 이 메시지를 받을 일은 없음
    console.warn("Controller received controller_left_room message, this should not happen.");
});


function handleDisconnect() {
    console.log("Controller: Handling disconnect (Receiver left or connection failed).");
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    screenVideo.srcObject = null;
    alert("상대방(Receiver)과의 연결이 끊어졌거나 종료되었습니다.");
    // UI에 "리시버 대기 중..." 같은 메시지 다시 표시 가능
}