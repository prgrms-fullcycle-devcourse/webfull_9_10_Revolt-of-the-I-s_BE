import pool from "../config/db";

export interface TaskRow {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  content: string;
  status: "Todo" | "Doing" | "Done" | "Checked";
  requester_id: number;
  worker_id: number | null;
  created_at: Date;
  comment_count: number;
}

export interface TaskUserInfo {
  uuid: number;
  name: string;
  profile_image: string | null;
}

export interface CommentRow {
  uuid: number;
  task_id: number;
  user_id: number;
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
  requester_id: number;
  worker_id: number | null;
  created_at: Date;
  requester: TaskUserInfo;
  worker: TaskUserInfo | null;
  comments: CommentRow[];
}

export interface CreateTaskInput {
  teamId: number;
  title: string;
  content: string;
  requesterId: number;
  workerId: number | null;
}

export interface CreatedTaskRow {
  id: number;
  task_number: number;
  team_id: number;
  title: string;
  content: string;
  status: "Todo";
  requester_id: number;
  worker_id: number | null;
  created_at: Date;
}

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
      COALESCE(COUNT(c.uuid), 0)::INT AS comment_count
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
      c.uuid, c.task_id, c.content, c.created_at,
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

  const [taskResult, commentsResult] = await Promise.all([
    pool.query(taskQuery, [taskId]),
    pool.query(commentsQuery, [taskId]),
  ]);

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
