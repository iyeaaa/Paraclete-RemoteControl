// (제공해주신 원본 src/public/js/cropworker.js 내용 전체)
let rt, rl, rr, rb;

function transform(frame, controller) {
    const top = frame.displayHeight * (rt / 100);
    const left = frame.displayWidth * (rl / 100);
    const right = frame.displayWidth * (rr / 100);
    const bottom = frame.displayHeight * (rb / 100);

    function alignTo(value, alignment) {
        return value - (value % alignment);
    }

    const alignedLeft = alignTo(Math.round(left), 2);
    const alignedTop = alignTo(Math.round(top), 2);
    const alignedWidth = alignTo(Math.round(frame.displayWidth - (left + right)), 2)
    const alignedHeight = alignTo(Math.round(frame.displayHeight - (top + bottom)), 2)

    // console.log("Cropping rect:", alignedLeft, alignedTop, alignedWidth, alignedHeight);

    if (alignedWidth <= 0 || alignedHeight <= 0) {
        // console.warn("Invalid crop dimensions, closing frame and not enqueuing.");
        frame.close(); // 유효하지 않은 프레임은 닫기만 함
        return;
    }

    try {
        const newFrame = new VideoFrame(frame, {
            visibleRect: {
                x: alignedLeft,
                width: alignedWidth,
                y: alignedTop,
                height: alignedHeight,
            }
        });
        controller.enqueue(newFrame);
    } catch (e) {
        // console.error("Error creating new VideoFrame in worker:", e);
    } finally {
        frame.close();
    }
}

onmessage = async (event) => {
    const { operation } = event.data;
    if (operation === 'crop') {
        const { readable, writable, top, bottom, left, right } = event.data;

        // crop 파라미터 저장
        rt = top;
        rb = bottom;
        rl = left;
        rr = right;

        try {
            // AbortController는 TransformStream 생성 시 signal로 전달해야 함
            // 이전 파이프를 명시적으로 중단시키는 로직은 WebRTC Insertable Streams에서는
            // 보통 새로운 MediaStreamTrackProcessor/Generator를 만드는 것으로 대체됨
            // 여기서는 readable/writable이 새로 전달되므로 이전 작업은 자동으로 중단됨.
            await readable
                .pipeThrough(new TransformStream({ transform }))
                .pipeTo(writable);
        } catch (err) {
            if (err.name === 'AbortError') {
                // console.log('Worker: Previous pipe operation was aborted.');
            } else {
                // console.error('Worker: Error in pipe operation:', err);
            }
        }
    } else {
        console.error('Worker: Unknown operation', operation);
    }
};