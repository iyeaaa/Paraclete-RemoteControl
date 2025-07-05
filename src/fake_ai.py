# fake_ai.py

import time
import json
import sys

# 이 스크립트는 AI 분석을 흉내만 냅니다.
# Node.js로부터 이미지 경로를 인자로 받지만, 실제로는 사용하지 않습니다.
# image_path = sys.argv[1] # 이 줄은 나중에 진짜 AI를 쓸 때 활성화합니다.

# 1초 동안 분석하는 척 잠시 멈춥니다.
time.sleep(1)

# 미리 정해놓은 '가짜' 마스킹 영역 좌표를 만듭니다.
# 나중에 이 부분을 진짜 AI의 분석 결과로 교체하게 될 겁니다.
fake_masking_info = [
    {
        "class_name": "fake_notification",
        "confidence": 0.98,
        "coordinates": [150, 200, 450, 280] # [x1, y1, x2, y2] - 왼쪽 위, 오른쪽 아래 좌표
    }
]

# Node.js가 받을 수 있도록, 결과를 JSON 형식의 '문자열'로 출력(print)합니다.
# 이것이 두 시스템 간의 유일한 통신 방법입니다.
print(json.dumps(fake_masking_info))

# 스크립트가 성공적으로 끝났음을 알립니다.
sys.stdout.flush()