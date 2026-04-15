
# 🛠️ i-station — Backend

> **팀 협업 도구 서비스** | Node.js + TypeScript + Express + PostgreSQL (Neon)

</br>

## 📌 서비스 소개

> "묻지 말고 확인하자, 묻히지 않게 기록하자!"

**i-Station**은 소규모 개발팀을 위한 **협업 신뢰 시스템**입니다.

슬랙 메시지는 읽고 지나치기 쉽고, Jira는 너무 복잡합니다.

- PIN 번호 하나로 팀에 즉시 합류
- 칸반 보드로 태스크를 직관적으로 관리
- 실시간 알림으로 팀원의 변경사항 즉시 확인
- 회의록 · 퀵링크 · PDF를 한 곳에서 관리

</br>

## 💡 기획 배경

소규모 개발팀에서 흔히 발생하는 **3가지 노이즈**를 해결합니다.

| 문제                 | 설명                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| 요청 전달의 불확실성 | 슬랙 메시지는 읽고 지나치기 쉬워 담당자 도달 여부 확인 불가           |
| 진행 상황의 불투명성 | 담당자가 확인했는지, 현재 작업 중인지 알 수 없어 반복적인 재확인 발생 |
| 소통의 피로도        | "지금 계세요?", "언제 완료되나요?" 등 불필요한 질의로 인한 몰입 깨짐  |

</br>

## 🎯 목표

- **Ticket-Based Workflow** : 모든 요청을 카드화하여 누락 없는 업무 관리
- **Live Status** : 팀원 상태 배지로 불필요한 핑(Ping) 없이 소통 타이밍 자율 조절
- **History Log** : 업무 이력을 데이터로 남겨 개인 기여도 증명 및 팀 회고 활용
</br>

## 🏗️ 기술 스택

### 핵심 라이브러리
![Node.js](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=PostgreSQL&logoColor=white)

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
</br>

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

</br>

## 👨‍💻 팀원 역할

### 👨‍💻 Backend

| 프로필 | 이름 | 담당 기능 |
| :---: | :---: | :--- |
| <img src="https://github.com/user-attachments/assets/e4a07a88-da98-4687-8a93-6a95923d0160" width="100" height="100"> | **장건영** | • **auth**: 회원가입, 로그인, 로그아웃, 구글 OAuth <br> • **user**: 로그인 유저 조회, 내 상태 업데이트 |
| <img src="https://github.com/user-attachments/assets/e339ee49-85e7-40f4-9fcc-6766cc62b07f" width="100" height="100"> | **강영아** | • **log**: 팀 활동 로그 조회, 개인 활동 로그 조회 <br> • **task**: 목록 조회, 생성, 수정, 삭제, 상세 조회, 상태 변경(수락/제출/승인/반려) <br> • **Comment**: 작성, 수정, 삭제 <br> • **notification**: 알림 전체 조회, 읽지 않은 알림 조회, 읽음 처리, 전체 읽음 처리 <br> • **DB**: 마이그레이션 (Render → Neon) |
| <img src="https://github.com/user-attachments/assets/1a37049d-aec2-4a43-ae6d-452fbef42095" width="100" height="100"> | **김가영** | • **team**: 팀 목록 조회, 팀 생성, 팀 탈퇴, 팀 가입, 포지션 수정, 활동 중인 팀원 목록, 팀 멤버 목록 조회 <br> • **archive**: 회의록 작성/수정/삭제/목록/상세, 퀵링크 생성/조회/삭제, 문서 등록/조회/삭제 |                                                                           |

### Frontend

| 이름   | 담당 기능                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------ |
| 송정화 | 칸반보드 (Task CRUD + 상태변경) / 실시간 댓글 (Pusher) / 알림 시스템 / 사이드바 & 유저 상태 관리 |
| 허송희 | 팀원 정보 (목록/포지션 수정) / 문서 & 퀵링크 (조회/생성/삭제) / 회의록 (조회/생성/수정/삭제)     |
| 김병성 | 로그인/회원가입 (Google OAuth 포함) / 프로필 이미지 업로드 / 팀 로비 (조회/생성/입장/탈퇴)       |

</br>

## 🗄️ ERD

<img width="654" height="544" alt="erd" src="https://github.com/user-attachments/assets/7bbf1cb2-7bad-4663-b55e-0f656aef3ef8" />

</br>

## ✅ 아키텍처

<img width="607" height="727" alt="ark" src="https://github.com/user-attachments/assets/dcf26126-6b3a-40e4-8422-6fa2d2da279b" />

</br>

## 📁 프로젝트 구조

```
src/
├── config/
│   ├── db.ts              # PostgreSQL 연결 풀 + 트랜잭션 유틸
│   └── swagger.yaml       # API 문서 정의 (Swagger)
├── repositories/          # DB 쿼리 함수 (순수 SQL)
│   ├── taskRepository.ts
│   ├── logRepository.ts
│   ├── notificationRepository.ts
│   └── ...
├── services/              # 비즈니스 로직 + 트랜잭션 처리
│   ├── taskService.ts
│   └── ...
├── routes/                # Express 라우터 및 엔드포인트 정의
├── utils/                 # 공통 유틸리티 및 전역 미들웨어
│   ├── middlewares/  
│   │   ├── auth.ts        # JWT 기반 사용자 인증
│   │   ├── teamMember.ts  # 팀 소속 및 접근 권한 체크
│   │   └── validators.ts  # 요청 데이터 유효성 검증
│   ├── constants/
│   │   └── response.ts    # 일관된 API 응답 규격(SUCCESS/ERROR) 정의
│   └── helpers/  
│       ├── s3.ts          # AWS S3 파일 업로드 및 관리 인터페이스
│       └── logger.ts      # 서버 실행 로그 및 에러 추적 시스템
├── app.ts                 # Express 앱 설정
└── server.ts              # 서버 시작 + 에러 핸들러

````
</br>

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

