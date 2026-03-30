import pool from "../config/db";

export interface TaskRow {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  content: string;
  status: "Todo" | "Doing" | "Done" | "Checked";
  requester_id: string;
  worker_id: string | null;
  created_at: Date;
  comment_count: number;
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
}

export interface UpdatedTaskStatusRow {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  status: "Todo" | "Doing" | "Done" | "Checked";
  requester_id: string;
  worker_id: string | null;
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
      t.worker_id,
      t.created_at,
      COALESCE(COUNT(c.id), 0)::INT AS comment_count
    FROM tasks t
    LEFT JOIN comments c ON t.id = c.task_id
    WHERE t.team_id = $1
    GROUP BY t.id, t.task_number, t.team_id, t.title, t.content,
             t.status, t.requester_id, t.worker_id, t.created_at
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
      t.status, t.created_at,
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
    WHERE t.id = $1
  `;

  const commentsQuery = `
    SELECT
      c.id, c.task_id, c.content, c.created_at,
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

// Task 생성
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
// Task 삭제
export const deleteTaskById = async (taskId: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM tasks WHERE id = $1 RETURNING id`,
    [taskId],
  );

  return result.rows.length > 0;
};

// 댓글 작성
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

// 댓글 수정
export const updateCommentById = async (
  commentId: number,
  content: string,
): Promise<UpdatedCommentRow | null> => {
  const result = await pool.query(
    `UPDATE comments SET content = $1 WHERE id = $2
     RETURNING id, task_id, content, created_at, user_id`,
    [content, commentId],
  );

  if (result.rows.length === 0) return null;

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

// task 상태 업데이트
export const updateTaskStatusByTask = async (
  taskId: number,
  currentStatus: "Todo" | "Doing" | "Done" | "Checked",
  nextStatus: "Todo" | "Doing" | "Done" | "Checked",
): Promise<UpdatedTaskStatusRow | null> => {
  const result = await pool.query(
    `UPDATE tasks SET status = $1 
     WHERE id = $2 AND status = $3
     RETURNING id, task_number, team_id, title, status, requester_id, worker_id`,
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
