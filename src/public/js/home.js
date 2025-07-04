document.addEventListener('DOMContentLoaded', () => {
    const socket = io(); // home.js에서도 소켓 연결 사용

    const roomNameInput = document.getElementById('roomName');
    const startAsReceiverBtn = document.getElementById('startAsReceiverBtn');
    const startAsControllerBtn = document.getElementById('startAsControllerBtn');
    const errorMessageP = document.getElementById('errorMessage');

    function validateRoomName(roomName) {
        if (!roomName) {
            errorMessageP.textContent = '방 이름을 입력해주세요.';
            roomNameInput.focus();
            return false;
        }
        if (!/^[a-zA-Z0-9-]+$/.test(roomName)) {
            errorMessageP.textContent = '방 이름은 영문, 숫자, 하이픈(-)만 사용할 수 있습니다.';
            roomNameInput.focus();
            return false;
        }
        errorMessageP.textContent = ''; // 유효성 검사 통과 시 오류 메시지 초기화
        return true;
    }

    startAsReceiverBtn.addEventListener('click', () => {
        const roomName = roomNameInput.value.trim();
        if (!validateRoomName(roomName)) return;

        // Receiver로 입장 전 서버에 확인 요청
        socket.emit("check_receiver_join_possibility", { roomName });
    });

    startAsControllerBtn.addEventListener('click', () => {
        const roomName = roomNameInput.value.trim();
        if (!validateRoomName(roomName)) return;
        console.log("ddd")

        // Controller는 바로 입장 시도 (서버에서 기존 Controller 존재 여부 등을 체크)
        window.location.href = `/controller.html?room=${encodeURIComponent(roomName)}`;
    });

    roomNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            // 엔터 시 어떤 버튼을 기본으로 할지 결정 (예: Controller 버튼)
            // 혹은 가장 마지막에 활성화된 입력 필드에 따라 동작하도록 할 수도 있음
            // 여기서는 간단히 Controller 버튼 클릭과 동일하게 처리 (또는 Receiver)
            startAsControllerBtn.click(); // 또는 startAsReceiverBtn.click();
        }
    });

    // --- 서버로부터의 응답 처리 ---
    socket.on("receiver_can_proceed_to_join", ({ roomName }) => {
        // 서버가 Receiver 입장이 가능하다고 응답하면 receiver.html로 이동
        console.log("Server confirmed: Receiver can proceed to join room", roomName);
        window.location.href = `/receiver.html?room=${encodeURIComponent(roomName)}`;
    });

    socket.on("receiver_cannot_join_yet", ({ message }) => {
        // 서버가 Receiver 입장이 불가능하다고 응답하면 index.html에 오류 메시지 표시
        console.warn("Server responded: Receiver cannot join yet -", message);
        errorMessageP.textContent = message;
    });

    // home.js에서 연결 에러 처리 (선택적)
    socket.on("connect_error", (err) => {
        console.error("Connection failed in home.js:", err);
        errorMessageP.textContent = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
    });
});