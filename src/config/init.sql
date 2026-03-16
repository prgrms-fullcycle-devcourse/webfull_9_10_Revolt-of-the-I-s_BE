-- i-Station Database Schema
-- Last Updated: 2026-03-16

-- 기존 테이블 및 타입 초기화 (재실행 시 충돌 방지)
DROP TABLE IF EXISTS logs, archives, comments, tasks, team_member, teams, users CASCADE;
DROP TYPE IF EXISTS member_status, task_status, archive_type, log_action CASCADE;

-- 1. ENUM 타입 정의
CREATE TYPE member_status AS ENUM ('업무 중', '회의 중', '쉬는 중', '자리 비움');
CREATE TYPE task_status AS ENUM ('Todo', 'Doing', 'Done', 'Checked');
CREATE TYPE archive_type AS ENUM ('LINK', 'NOTE', 'PDF');
CREATE TYPE log_action AS ENUM ('CREATE', 'MOVE', 'DELETE', 'UPDATE');

-- 2. 유저 정보 테이블
CREATE TABLE users (
    uuid SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(20) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    github_url VARCHAR(255),
    profile_image TEXT,
    google_uid VARCHAR(255) UNIQUE
);

-- 3. 팀(스페이스) 테이블
CREATE TABLE teams (
    uuid SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,
    pin_password CHAR(6) NOT NULL,
    owner_id INT NOT NULL REFERENCES users(uuid)
);

-- 4. 팀 멤버 관계 테이블
CREATE TABLE team_member (
    uuid SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(uuid) ON DELETE CASCADE,
    user_id INT REFERENCES users(uuid) ON DELETE CASCADE,
    position VARCHAR(50) NOT NULL DEFAULT '팀원',
    status member_status
);

-- 5. 업무(태스크) 테이블
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(uuid) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status task_status NOT NULL DEFAULT 'Todo',
    requester_id INT REFERENCES users(uuid),
    worker_id INT REFERENCES users(uuid),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 코멘트 테이블
CREATE TABLE comments (
    uuid SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(uuid),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 아카이브(자료실) 테이블
CREATE TABLE archives (
    uuid SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(uuid) ON DELETE CASCADE,
    type archive_type NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 활동 로그 테이블
CREATE TABLE logs (
    uuid SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(uuid) ON DELETE CASCADE,
    user_id INT REFERENCES users(uuid),
    task_id INT REFERENCES tasks(id) ON DELETE SET NULL,
    action_type log_action NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);