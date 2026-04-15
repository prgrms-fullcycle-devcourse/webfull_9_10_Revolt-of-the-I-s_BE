import pool from "../config/db";
import { PoolClient } from "pg";

export interface TaskRow {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  content: string;
  status: "Todo" | "Doing" | "Done" | "Checked";
  requester_id: string;
  requester_name: string;
  worker_id: string | null;
  worker_name: string | null;
  created_at: Date;
  comment_count: number;
  is_edited: boolean;
}

export interface TaskUserInfo {
  uuid: string;
  name: string;
  profile_image: string | null;
}

export interface CommentRow {
  id: number;
  task_id: number;
  user_id: string;
  content: string;
  created_at: Date;
  user: TaskUserInfo;
  is_edited: boolean;
}

export interface TaskDetailRow {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  content: string;
  status: "Todo" | "Doing" | "Done" | "Checked";
  requester_id: string;
  worker_id: string | null;
  created_at: Date;
  requester: TaskUserInfo;
  worker: TaskUserInfo | null;
  comments: CommentRow[];
  is_edited: boolean;
}

export interface CreateTaskInput {
  teamId: number;
  title: string;
  content: string;
  requesterId: string;
  workerId: string | null;
}

export interface CreatedTaskRow {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  content: string;
  status: "Todo";
  requester_id: string;
  worker_id: string | null;
  created_at: Date;
}

export interface CreatedCommentRow {
  id: number;
  task_id: number;
  content: string;
  created_at: Date;
  user: TaskUserInfo;
}

export interface UpdatedCommentRow {
  id: number;
  task_id: number;
  content: string;
  created_at: Date;
  user: TaskUserInfo;
  is_edited: boolean;
}

export interface UpdatedTaskStatusRow {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  status: "Todo" | "Doing" | "Done" | "Checked";
  requester_id: string;
  worker_id: string | null;
  is_edited: boolean;
}

// 팀별 Task 목록 조회
export const findTasksByTeam = async (teamId: number): Promise<TaskRow[]> => {
  const query = `
    SELECT
      t.id,
      t.task_number,
      t.team_id,
      t.title,
      t.content,
      t.status,
      t.requester_id,
      ru.name AS requester_name,
      t.worker_id,
      wu.name AS worker_name,
      t.is_edited, 
      t.created_at,
      COALESCE(COUNT(c.id), 0)::INT AS comment_count
    FROM tasks t
    LEFT JOIN comments c ON t.id = c.task_id
    JOIN users ru ON t.requester_id = ru.uuid
    LEFT JOIN users wu ON t.worker_id = wu.uuid
    WHERE t.team_id = $1 AND t.is_deleted = false
    GROUP BY t.id, t.task_number, t.team_id, t.title, t.content,
        t.status, t.requester_id, ru.name, t.worker_id, wu.name, t.created_at, t.is_edited
    ORDER BY t.created_at DESC
  `;

  const result = await pool.query<TaskRow>(query, [teamId]);
  return result.rows;
};

// Task 상세 조회
export const findTaskById = async (
  taskId: number,
): Promise<TaskDetailRow | null> => {
  const taskQuery = `
    SELECT
      t.id, t.task_number, t.team_id, t.title, t.content,
      t.status, t.is_edited, t.created_at,
      json_build_object(
        'uuid', ru.uuid,
        'name', ru.name,
        'profile_image', ru.profile_image
      ) AS requester,
      CASE
        WHEN wu.uuid IS NOT NULL THEN
          json_build_object(
            'uuid', wu.uuid,
            'name', wu.name,
            'profile_image', wu.profile_image
          )
        ELSE NULL
      END AS worker
    FROM tasks t
    JOIN users ru ON t.requester_id = ru.uuid
    LEFT JOIN users wu ON t.worker_id = wu.uuid
    WHERE t.id = $1 AND t.is_deleted = false
  `;

  const commentsQuery = `
    SELECT
      c.id, c.task_id, c.content, c.created_at, c.is_edited,
      json_build_object(
        'uuid', u.uuid,
        'name', u.name,
        'profile_image', u.profile_image
      ) AS user
    FROM comments c
    JOIN users u ON c.user_id = u.uuid
    WHERE c.task_id = $1
    ORDER BY c.created_at ASC
  `;

  const taskResult = await pool.query(taskQuery, [taskId]);
  const commentsResult = await pool.query(commentsQuery, [taskId]);

  if (taskResult.rows.length === 0) return null;

  const row = taskResult.rows[0];

  return {
    ...row,
    comments: commentsResult.rows,
  };
};

// =============================================
// 기본 버전 - 트랜잭션 없이 단독으로 task 생성할 때 사용
// =============================================
export const insertTask = async (
  input: CreateTaskInput,
): Promise<CreatedTaskRow> => {
  const { teamId, title, content, requesterId, workerId } = input;

  const result = await pool.query<CreatedTaskRow>(
    `INSERT INTO tasks (task_number, team_id, title, content, requester_id, worker_id)
     VALUES (
       (SELECT COALESCE(MAX(task_number), 0) + 1 FROM tasks WHERE team_id = $1),
       $1, $2, $3, $4, $5
     )
     RETURNING id, task_number, team_id, title, content, status, requester_id, worker_id, created_at`,
    [teamId, title, content, requesterId, workerId],
  );

  return result.rows[0]!;
};

// =============================================
// 트랜잭션 버전 - withTransaction 안에서 사용
// task 생성 + 로그 생성 + 알림 생성을 하나로 묶어서 처리
// 중간에 실패하면 전체 ROLLBACK됨
// =============================================
export const insertTaskWithClient = async (
  client: PoolClient,
  input: CreateTaskInput,
): Promise<CreatedTaskRow> => {
  const { teamId, title, content, requesterId, workerId } = input;

  const result = await client.query<CreatedTaskRow>(
    `INSERT INTO tasks (task_number, team_id, title, content, requester_id, worker_id)
     VALUES (
       (SELECT COALESCE(MAX(task_number), 0) + 1 FROM tasks WHERE team_id = $1),
       $1, $2, $3, $4, $5
     )
     RETURNING id, task_number, team_id, title, content, status, requester_id, worker_id, created_at`,
    [teamId, title, content, requesterId, workerId],
  );

  return result.rows[0]!;
};

// =============================================
// 기본 버전 - 트랜잭션 없이 단독으로 task 수정할 때 사용
// =============================================
export const updateTaskById = async (
  taskId: number,
  data: { title?: string; content?: string; worker_id?: string | null },
): Promise<UpdatedTaskStatusRow | null> => {
  const result = await pool.query(
    `UPDATE tasks
     SET
       title = COALESCE($1, title),
       content = COALESCE($2, content),
       worker_id = COALESCE($3, worker_id),
       is_edited = true
     WHERE id = $4
     RETURNING id, task_number, team_id, title, status, requester_id, worker_id, is_edited`,
    [data.title, data.content, data.worker_id, taskId],
  );
  return result.rows[0] ?? null;
};

// =============================================
// 트랜잭션 버전 - withTransaction 안에서 사용
// task 수정 + 로그 생성 + 알림 생성을 하나로 묶어서 처리
// 중간에 실패하면 전체 ROLLBACK됨
// =============================================
export const updateTaskWithClient = async (
  client: PoolClient,
  taskId: number,
  data: { title?: string; content?: string; worker_id?: string | null },
): Promise<UpdatedTaskStatusRow | null> => {
  const result = await client.query(
    `UPDATE tasks
     SET
       title = COALESCE($1, title),
       content = COALESCE($2, content),
       worker_id = COALESCE($3, worker_id),
       is_edited = true
     WHERE id = $4
     RETURNING id, task_number, team_id, title, status, requester_id, worker_id, is_edited`,
    [data.title, data.content, data.worker_id, taskId],
  );
  return result.rows[0] ?? null;
};

// =============================================
// 기본 버전 - 트랜잭션 없이 단독으로 task 삭제할 때 사용
// =============================================
export const deleteTaskById = async (taskId: number): Promise<boolean> => {
  const result = await pool.query(
    `UPDATE tasks SET is_deleted = true WHERE id = $1 RETURNING id`,
    [taskId],
  );
  return result.rows.length > 0;
};

// =============================================
// 트랜잭션 버전 - withTransaction 안에서 사용
// task 삭제 + 로그 생성 + 알림 생성을 하나로 묶어서 처리
// 중간에 실패하면 전체 ROLLBACK됨
// =============================================
export const deleteTaskWithClient = async (
  client: PoolClient,
  taskId: number,
): Promise<boolean> => {
  const result = await client.query(
    `UPDATE tasks SET is_deleted = true WHERE id = $1 RETURNING id`,
    [taskId],
  );
  return result.rows.length > 0;
};

// =============================================
// 기본 버전 - 트랜잭션 없이 단독으로 댓글 저장할 때 사용
// =============================================
export const insertComment = async (
  taskId: number,
  userId: string,
  content: string,
): Promise<CreatedCommentRow> => {
  const result = await pool.query(
    `INSERT INTO comments (task_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, task_id, content, created_at, user_id`,
    [taskId, userId, content],
  );

  const comment = result.rows[0];

  const commentWithUser = await pool.query(
    `SELECT
      c.id, c.task_id, c.content, c.created_at,
      json_build_object(
        'uuid', u.uuid,
        'name', u.name,
        'profile_image', u.profile_image
      ) AS user
     FROM comments c
     JOIN users u ON c.user_id = u.uuid
     WHERE c.id = $1`,
    [comment.id],
  );

  return commentWithUser.rows[0];
};

// =============================================
// 트랜잭션 버전 - withTransaction 안에서 사용
// 댓글 저장 + 알림 생성을 하나로 묶어서 처리
// 댓글은 저장됐는데 알림 저장 실패하는 불일치 방지
// =============================================
export const insertCommentWithClient = async (
  client: PoolClient,
  taskId: number,
  userId: string,
  content: string,
): Promise<CreatedCommentRow> => {
  const result = await client.query(
    `INSERT INTO comments (task_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, task_id, content, created_at, user_id`,
    [taskId, userId, content],
  );

  const comment = result.rows[0];

  // 댓글 작성자 정보도 같은 트랜잭션 client로 조회
  const commentWithUser = await client.query(
    `SELECT
      c.id, c.task_id, c.content, c.created_at,
      json_build_object(
        'uuid', u.uuid,
        'name', u.name,
        'profile_image', u.profile_image
      ) AS user
     FROM comments c
     JOIN users u ON c.user_id = u.uuid
     WHERE c.id = $1`,
    [comment.id],
  );

  return commentWithUser.rows[0];
};

// 댓글 수정
export const updateCommentById = async (
  commentId: number,
  content: string,
): Promise<UpdatedCommentRow | null> => {
  const result = await pool.query(
    `UPDATE comments SET content = $1, is_edited = true WHERE id = $2
     RETURNING id, task_id, content, created_at, user_id, is_edited`,
    [content, commentId],
  );

  if (result.rows.length === 0) return null;

  const comment = result.rows[0];

  const commentWithUser = await pool.query(
    `SELECT
      c.id, c.task_id, c.content, c.created_at, c.is_edited,
      json_build_object(
        'uuid', u.uuid,
        'name', u.name,
        'profile_image', u.profile_image
      ) AS user
     FROM comments c
     JOIN users u ON c.user_id = u.uuid
     WHERE c.id = $1`,
    [comment.id],
  );

  return commentWithUser.rows[0];
};

// 댓글 삭제
export const deleteCommentById = async (
  commentId: number,
): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM comments WHERE id = $1 RETURNING id`,
    [commentId],
  );
  return result.rows.length > 0;
};

// =============================================
// 기본 버전 - 트랜잭션 없이 단독으로 task 상태 변경할 때 사용
// =============================================
export const updateTaskStatusByTask = async (
  taskId: number,
  currentStatus: "Todo" | "Doing" | "Done" | "Checked",
  nextStatus: "Todo" | "Doing" | "Done" | "Checked",
): Promise<UpdatedTaskStatusRow | null> => {
  const result = await pool.query(
    `UPDATE tasks SET status = $1
     WHERE id = $2 AND status = $3
     RETURNING id, task_number, team_id, title, status, requester_id, worker_id, is_edited`,
    [nextStatus, taskId, currentStatus],
  );

  return result.rows[0] ?? null;
};

// =============================================
// 트랜잭션 버전 - withTransaction 안에서 사용
// 상태 변경 + 로그 생성을 하나로 묶어서 처리
// 중간에 실패하면 전체 ROLLBACK됨
// =============================================
export const updateTaskStatusWithClient = async (
  client: PoolClient,
  taskId: number,
  currentStatus: "Todo" | "Doing" | "Done" | "Checked",
  nextStatus: "Todo" | "Doing" | "Done" | "Checked",
): Promise<UpdatedTaskStatusRow | null> => {
  const result = await client.query(
    `UPDATE tasks SET status = $1
     WHERE id = $2 AND status = $3
     RETURNING id, task_number, team_id, title, status, requester_id, worker_id, is_edited`,
    [nextStatus, taskId, currentStatus],
  );

  return result.rows[0] ?? null;
};

// 댓글 존재 + 작성자 확인용
export const existsCommentById = async (commentId: number) => {
  const result = await pool.query(
    `SELECT id, task_id, user_id FROM comments WHERE id = $1`,
    [commentId],
  );
  return result.rows[0] ?? null;
};
