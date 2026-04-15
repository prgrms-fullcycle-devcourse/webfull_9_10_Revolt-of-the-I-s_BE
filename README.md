```markdown
# 🛠️ i-station — Backend

> **팀 협업 도구 서비스** | Node.js + TypeScript + Express + PostgreSQL (Neon)

---

## 📌 서비스 소개

> "묻지 말고 확인하자, 묻히지 않게 기록하자!"

\***\*i-Station\*\***은 소규모 개발팀을 위한 **협업 신뢰 시스템**입니다.

슬랙 메시지는 읽고 지나치기 쉽고, Jira는 너무 복잡합니다.

- PIN 번호 하나로 팀에 즉시 합류
- 칸반 보드로 태스크를 직관적으로 관리
- 실시간 알림으로 팀원의 변경사항 즉시 확인
- 회의록 · 퀵링크 · PDF를 한 곳에서 관리

---

## 💡 기획 배경

소규모 개발팀에서 흔히 발생하는 3가지 문제

| 문제                 | 설명                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| 요청 전달의 불확실성 | 슬랙 메시지는 읽고 지나치기 쉬워 담당자 도달 여부 확인 불가           |
| 진행 상황의 불투명성 | 담당자가 확인했는지, 현재 작업 중인지 알 수 없어 반복적인 재확인 발생 |
| 소통의 피로도        | "지금 계세요?", "언제 완료되나요?" 등 불필요한 질의로 인한 몰입 깨짐  |

---

## 🎯 목표

- **Ticket-Based Workflow** : 모든 요청을 카드화하여 누락 없는 업무 관리
- **Live Status** : 팀원 상태 배지로 불필요한 핑(Ping) 없이 소통 타이밍 자율 조절
- **History Log** : 업무 이력을 데이터로 남겨 개인 기여도 증명 및 팀 회고 활용

---

## 🏗️ 기술 스택

| 구분           | 기술                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime        | Node.js + TypeScript                                                                                     |
| Framework      | Express v5                                                                                               |
| Database       | PostgreSQL (Neon — Serverless), pg로 직접 쿼리                                                           |
| **Validation** | Zod                                                                                                      |
| 인증           | JWT (jsonwebtoken) + Google OAuth2 (google-auth-library) + 비밀번호 해싱 (bcrypt) + 쿠키 (cookie-parser) |
| 실시간         | Pusher                                                                                                   |
| 파일 저장      | AWS S3 (@aws-sdk/client-s3, multer + multer-s3)                                                          |
| 배포           | Render                                                                                                   |
| API 문서       | OpenAPI 3.0 (YAML) + Swagger UI (swagger-ui-express)                                                     |
| **기타**       | CORS + 식별자 (uuid)                                                                                     |
| 패키지 매니저  | pnpm, ts-node / tsx                                                                                      |

---

## 🔑 핵심 기능

### 🔐 인증 (Authentication)

- 이메일 / 비밀번호 회원가입 및 로그인
- Google OAuth2 소셜 로그인
- JWT 쿠키 기반 인증 (HttpOnly Cookie)
- 비밀번호 bcrypt 암호화

### 👥 팀 (Team)

- 팀 생성 / PIN 번호로 가입 / 탈퇴
- 멤버 포지션 · 상태(업무 중, 회의 중, 자리 비움, 쉬는 중) 관리
- 마지막 멤버 탈퇴 시 팀 자동 삭제

### ✅ 태스크 — 칸반 보드 (Task)

- 태스크 생성 · 수정 · 삭제
- 상태 전이: `Todo → Doing → Done → Checked`
- 담당자 지정, 우선순위 설정
- 댓글 기능 (작성 · 수정 기록 포함)
- Pusher 기반 실시간 칸반 보드 동기화 (`task-created`, `task-updated`, `task-deleted`)

### 📁 아카이브 (Archive)

- 회의록 작성 · 수정 · 삭제
- 퀵링크 등록 · 삭제
- PDF 파일 업로드 · 삭제 (AWS S3 연동)

### 🔔 알림 / 실시간 (Notification)

- Pusher 기반 실시간 알림 수신
- 읽음 처리 (단건 / 전체)
- 알림에 팀 이름(`team_name`) 포함 응답

### 📋 로그 (Log)

- 태스크 변경 이력 자동 기록 (생성, 수정, 삭제, 상태 변경)
- 트랜잭션 내 원자적 로그 저장

---

## 👨‍💻 팀원 역할

### Backend

| 프로필                                                                                                     | 이름   | 담당 기능                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| https://www.notion.so/9-2d9296d38a60804e8dc8d95b5b22f4e3?source=copy_link#2d9296d38a6080119669d2a3072096a7 | 장건영 | `auth`: 회원가입, 로그인, 로그아웃, 구글 OAuth / `user`: 로그인 유저 조회, 내 상태 업데이트                                                                                                                                                                                     |
| https://www.notion.so/9-2d9296d38a60803e8a20e367607fa3d6?source=copy_link#2d9296d38a608078a038cd198f4a061f | 강영아 | `log`: 팀 활동 로그 조회, 개인 활동 로그 조회 / `task`: 목록 조회, 생성, 수정, 삭제, 상세 조회, 상태 변경(수락/제출/승인/반려) / `Comment`: 작성, 수정, 삭제 / `notification`: 알림 전체 조회, 읽지 않은 알림 조회, 읽음 처리, 전체 읽음 처리 / DB 마이그레이션 (Render → Neon) |
| https://www.notion.so/9-2d9296d38a608065b256ca1e5f71f67a?source=copy_link#2d9296d38a608058ad40d65f410f2866 | 김가영 | `team`: 팀 목록 조회, 팀 생성, 팀 탈퇴, 팀 가입, 포지션 수정, 활동 중인 팀원 목록, 팀 멤버 목록 조회 / `archive`: 회의록 작성/수정/삭제/목록/상세, 퀵링크 생성/조회/삭제, 문서 등록/조회/삭제                                                                                   |

### Frontend

| 이름   | 담당 기능                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------ |
| 송정화 | 칸반보드 (Task CRUD + 상태변경) / 실시간 댓글 (Pusher) / 알림 시스템 / 사이드바 & 유저 상태 관리 |
| 허송희 | 팀원 정보 (목록/포지션 수정) / 문서 & 퀵링크 (조회/생성/삭제) / 회의록 (조회/생성/수정/삭제)     |
| 김병성 | 로그인/회원가입 (Google OAuth 포함) / 프로필 이미지 업로드 / 팀 로비 (조회/생성/입장/탈퇴)       |

---

## 🗄️ ERD

![image.png](attachment:53a9f3fc-24d8-4b97-97a0-7e3bcbf11ebe:image.png)

---

## ✅ 아키텍처

![image.png](attachment:7306a9c2-3fb5-4330-bb55-373994dff42d:image.png)

---

## 📁 프로젝트 구조
```

src/
├── config/
│ ├── db.ts # PostgreSQL 연결 풀 + 트랜잭션 유틸
│ └── swagger.yaml # API 문서 정의 (Swagger)
├── repositories/ # DB 쿼리 함수 (순수 SQL)
│ ├── taskRepository.ts
│ ├── logRepository.ts
│ ├── notificationRepository.ts
│ └── ...
├── services/ # 비즈니스 로직 + 트랜잭션 처리
│ ├── taskService.ts
│ └── ...
├── routes/ # Express 라우터 및 엔드포인트 정의
├── utils/ # 공통 유틸리티 및 전역 미들웨어
│ ├── middlewares/  
│ │ ├── auth.ts # JWT 기반 사용자 인증
│ │ ├── teamMember.ts# 팀 소속 및 접근 권한 체크
│ │ └── validators.ts# 요청 데이터 유효성 검증
│ ├── constants/
│ │ └── response.ts # 일관된 API 응답 규격(SUCCESS/ERROR) 정의
│ └── helpers/  
│ ├── s3.ts # AWS S3 파일 업로드 및 관리 인터페이스
│ └── logger.ts # 서버 실행 로그 및 에러 추적 시스템
├── app.ts # Express 앱 설정
└── server.ts # 서버 시작 + 에러 핸들러

````

---

## ⚙️ 환경변수 (.env)

```env
# --- Database (PostgreSQL) ---
DATABASE_URL=

# --- Authentication (JWT) ---
JWT_SECRET=

# --- Google OAuth2 (Social Login) ---
GOOGLE_CLIENT_ID=

# --- AWS S3 (File Storage) ---
# 프로필 이미지 및 PDF 회의록 저장용
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

# --- Pusher (Real-time Service) ---
# 실시간 상태 변경 및 댓글 알림용
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=

# --- Server Configuration ---
PORT=
````

---

## 🚀 실행 방법

```bash
# 패키지 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

```

```
