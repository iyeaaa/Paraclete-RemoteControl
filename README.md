# **Project: Paraclete-RemoteControl**

## **1. 프로젝트 비전 및 목표**

* **한 줄 요약**: WebRTC 기반의 실시간 원격 제어 솔루션에, **'AI가 들어올 자리를 미리 계산한'** 확장 가능한 아키텍처를 적용하고, 최종적으로는 AI가 인간의 실수를 보완하는 지능형 시스템을 구축한다.
* **핵심 철학**: '파라클레테(Paraclete)', 즉 **'곁에서 돕는 자'**라는 이름처럼, 기술을 통해 사람과 사람의 원격 협업을 더 안전하고 효율적으로 돕는다.
* **최종 목표**: '네이버/카카오' 등 최상위 IT 기업의 기술 면접관에게 **시스템 아키텍처 설계 능력, 실시간 통신 기술에 대한 깊이, 그리고 AI 융합 능력**을 모두 증명하는 압도적인 포트폴리오 완성.

## **2. 우리가 피해야 할 함정 (기술 부채)**

> "일단 기능부터 만들고, 나중에 시스템을 합치자"는 생각은, "일단 벽지부터 바르고, 나중에 전기 배선 공사를 하자"는 것과 같다. 결국 더 큰 비용과 시간을 치르게 된다.

우리는 이 함정을 피하기 위해, **'미래를 위한 배선 공사(아키텍처 설계)'**를 가장 먼저 진행하는, 더 전문적이고 현명한 길을 선택한다.

## **3. 마일스톤(Milestone) 기반 개발 로드맵**

시간에 쫓기지 않고, 각 단계를 완벽하게 마스터하며 나아간다.

---

### **Milestone 1: 'AI를 위한 배선 공사' - 가짜 AI를 이용한 통합 아키텍처 완성**

* **🎯 목표**: 분리된 시스템을 하나로 합치면서도, 당장 AI를 몰라도 프로젝트를 진행할 수 있도록 **'AI인 척하는 가짜(Fake) 모듈'**을 이용해 전체 시스템의 뼈대를 완성한다.
* **🤔 왜 중요한가?**:
    * 학생분이 지적한 가장 큰 문제(프로그램 분리, 성능 저하)를 해결하는 **가장 중요한 첫걸음**이다.
    * AI에 대한 부담 없이, 학생분이 가장 자신 있는 **시스템 아키텍처 설계와 WebRTC 개발에 먼저 집중**하여 성취감을 느낄 수 있다.
    * 향후 어떤 AI 모델이든 '전구 갈아 끼우듯' 쉽게 교체할 수 있는 유연한 구조를 확보한다.
* **🛠️ 구체적 실행 단계**:
    1.  **'가짜 AI' 제작**: 이미지 경로를 받으면, 분석하는 척 2초 정도 기다렸다가, 미리 정해진 가짜 좌표(예: `[{"coordinates": [100,100,200,200]}]`)를 JSON 형식으로 `print`만 하고 종료되는 간단한 `fake_ai.py` 스크립트를 만든다.
    2.  **API 파이프라인 구축**: `server.js`에서 `child_process.spawn`을 이용해 이 `fake_ai.py`를 호출하고, 그 결과를 받아오는 통합 아키텍처를 완성한다.
    3.  **'유령 커서' 동시 구현**: 1, 2단계를 진행하는 동안, **동시에** 시청자의 마우스 좌표를 공유자 화면에 '유령 커서'로 표시하는 기능을 구현하며 즉각적인 시각적 결과물을 확인한다.
* **✅ 완료 조건**: 시청자가 마우스를 움직이면 공유자 화면에 유령 커서가 따라다니고, 특정 버튼을 누르면 '가짜 AI'가 반환한 좌표에 사각형이 그려진다. 이 모든 것이 단일 시스템 내에서 작동한다.

---

### **Milestone 2: '완전한 원격 제어' - 핵심 기능 완성**

* **🎯 목표**: 튼튼하게 만들어진 아키텍처 위에서, 원격 제어의 핵심 기능인 '클릭'과 '키보드 입력'을 구현한다.
* **🤔 왜 중요한가?**: "어려울 것 같다"고 생각했던 원격 제어 기능을 직접 구현하며, **실시간 양방향 시스템을 바닥부터 구축하는 희귀한 경험**을 완성한다.
* **🛠️ 구체적 실행 단계**:
    1.  **이벤트 데이터 정의**: 시청자 측에서 발생하는 '클릭', '키보드 누름/뗌' 이벤트를 `{ "type": "click", "x": 150, "y": 300 }` 또는 `{ "type": "key", "key": "Enter" }` 와 같은 JSON 형식으로 정의한다.
    2.  **이벤트 전송**: 정의된 이벤트 데이터를 WebRTC 데이터 채널을 통해 공유자에게 실시간으로 전송한다.
    3.  **이벤트 실행**: 공유자 측 클라이언트가 이벤트 데이터를 받아서, Python의 `pynput` 같은 라이브러리를 통해 운영체제(OS)에서 실제 마우스 클릭과 키보드 입력을 실행시킨다.
* **✅ 완료 조건**: 시청자가 자신의 컴퓨터에서 키보드와 마우스를 조작하여, 공유자의 컴퓨터를 완벽하게 제어할 수 있다.

---

### **Milestone 3: '진짜 AI 엔진 교체' - 지능 탑재**

* **🎯 목표**: '가짜 AI'를 '진짜 AI'로 교체하고, 우리가 최종적으로 구상했던 '자동 위험 지대' 기능을 구현한다.
* **🤔 왜 중요한가?**: AI와 시스템 아키텍처를 결합하는 최종 단계. 우리가 설계한 '미래를 위한 배선'이 얼마나 효과적이었는지 증명하는 순간이다.
* **🛠️ 구체적 실행 단계**:
    1.  **엔진 교체**: Milestone 1에서 `fake_ai.py`를 호출했던 부분을, 팀원이 만들었던 `test.py`를 호출하도록 경로만 수정한다.
    2.  **'자동 위험 지대' 로직 구현**:
        * '안전지대' 바깥 영역만 캡처하여 AI에게 분석을 요청한다.
        * AI가 민감 정보(예: 카카오톡 알림)를 탐지하면, 해당 좌표를 '위험 지대' 목록에 추가한다.
        * Milestone 2의 제어 로직을 수정하여, '위험 지대'로 들어오는 원격 제어 이벤트는 모두 차단하도록 한다.
* **✅ 완료 조건**: 사용자가 설정한 '안전지대' 밖에서 카톡 알림이 뜨면, 그 위로는 원격 마우스 클릭이 되지 않는다.

---

### **Milestone 4: '최고의 포트폴리오' - 완성 및 스토리텔링**

* **🎯 목표**: 완성된 프로젝트의 기술적 깊이와 가치를 면접관에게 가장 효과적으로 전달할 수 있는 형태로 포장한다.
* **🤔 왜 중요한가?**: "만드는 것"만큼 "보여주는 것"도 중요하다.
* **🛠️ 구체적 실행 단계**:
    1.  **시연 영상 제작**: '안전지대' 설정 → '원격 제어' 시연 → '위험 지대' 자동 감지 및 차단으로 이어지는, 이 프로젝트만의 핵심 가치를 보여주는 1분 내외의 데모 영상을 제작한다.
    2.  **깃허브 README 작성**: 이 프로젝트의 **성장 스토리**를 작성한다.
        * **Problem**: 기존 프로젝트의 문제점(아키텍처 분리, 성능 저하)은 무엇이었는가?
        * **Process**: 이 문제를 해결하기 위해 어떤 기술적 결정(API화, '가짜 AI'를 이용한 선제적 설계)을 내렸는가?
        * **Solution**: 그 결과, 어떻게 인간의 수동 제어와 AI의 자동 감지가 결합된 독창적인 솔루션을 완성했는가?
* **✅ 완료 조건**: 코드를 모르는 사람이라도, 시연 영상과 깃허브 README만 보고도 이 프로젝트의 가치와 학생분의 역량을 충분히 이해할 수 있는 상태가 된다.