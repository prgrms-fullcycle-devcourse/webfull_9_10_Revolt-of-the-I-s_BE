import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes"; // status code 모듈
import {
  findTasksByTeam,
  findTaskById,
  insertTask,
  deleteTaskById,
  insertComment,
  existsTaskById,
  updateCommentById,
  existsCommentById,
  deleteCommentById,
  findTaskOwner,
} from "../repositories/taskRepository";
import pusher from "../config/pusher";
import { findLogsByTeam, insertLog } from "../repositories/logRepository";
import catchAsync, { ERROR, SUCCESS } from "../utils/response";
import { isValidId, isValidString } from "../utils/validators";

interface TaskQuantity {
  Todo: number;
  Doing: number;
  Done: number;
  Checked: number;
}

const getTeamTasksData = async (teamId: number) => {
  const tasks = await findTasksByTeam(teamId);

  const taskQuantity = tasks.reduce(
    (acc, task) => {
      const status = task.status as keyof TaskQuantity;
      acc[status]++;
      return acc;
    },
    { Todo: 0, Doing: 0, Done: 0, Checked: 0 } as TaskQuantity,
  );

  return { taskQuantity, tasks };
};

// 팀별 전체 테스크 조회
const getTasksByTeam = catchAsync(async (req: Request, res: Response) => {
  const { teamId } = req.params;

  if (!isValidId(teamId)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const data = await getTeamTasksData(Number(teamId));
  res.status(StatusCodes.OK).json(SUCCESS(data));
});

// 테스크 생성
const createTask = catchAsync(async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { title, content, worker_id } = req.body;

  if (!isValidId(teamId) || !isValidString(title) || !isValidString(content)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const requesterId = req.user!.uuid;

  const task = await insertTask({
    teamId: Number(teamId),
    title: title.trim(),
    content: content.trim(),
    requesterId,
    workerId: worker_id ? String(worker_id) : null,
  });

  await insertLog({
    teamId: task.team_id,
    userId: requesterId,
    taskId: task.id,
    actionType: "CREATE",
    message: `#${task.task_number} 요청 발행(Todo)`,
  });

  if (task.worker_id) {
    await pusher.trigger(`user-${task.worker_id}`, "new-task-requested", {
      message: `🔔 새로운 요청이 있습니다: ${task.title}`,
      taskId: task.id,
      taskNumber: task.task_number,
      teamId: task.team_id,
    });
    console.log(`✅ User ${task.worker_id}에게 알림 전송 완료!`);
  }

  res.status(StatusCodes.CREATED).json(SUCCESS(task));
});

// 테스크 상세 조회
const getTaskDetail = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  if (!isValidId(taskId)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const task = await findTaskById(Number(taskId));
  if (!task) {
    return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(SUCCESS(task));
});

// 테스크 삭제
const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  if (!isValidId(taskId)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const task = await findTaskOwner(Number(taskId));

  if (!task) {
    return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
  }

  const requesterId = req.user!.uuid;
  console.log(
    "task.requester_id:",
    task.requester_id,
    typeof task.requester_id,
  );
  console.log("requesterId:", requesterId, typeof requesterId);
  console.log("일치 여부:", task.requester_id === requesterId);

  if (task.requester_id !== requesterId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  await deleteTaskById(Number(taskId));

  res
    .status(StatusCodes.OK)
    .json(SUCCESS({ message: "성공적으로 삭제되었습니다." }));
});

// 테스크 상태 변경
const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {});

// 뎃글 작성
const createComment = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { content } = req.body;

  if (!isValidId(taskId) || !isValidString(content)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const exists = await existsTaskById(Number(taskId));
  if (!exists) {
    return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
  }

  const userId = req.user!.uuid;

  const comment = await insertComment(Number(taskId), userId, content.trim());

  await pusher.trigger(`task-${taskId}`, "new-comment", comment);

  res.status(StatusCodes.CREATED).json(SUCCESS(comment));
});

// 댓글 수정
const updateComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidId(commentId) || !isValidString(content)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const comment = await existsCommentById(Number(commentId));
  if (!comment) {
    return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
  }

  const userId = req.user!.uuid;

  if (comment.user_id !== userId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  const updated = await updateCommentById(Number(commentId), content.trim());

  res.status(StatusCodes.OK).json(SUCCESS(updated));
});

// 댓글 삭제
const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  if (!isValidId(commentId)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const comment = await existsCommentById(Number(commentId));
  if (!comment) {
    return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
  }

  const userId = req.user!.uuid;

  if (comment.user_id !== userId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  await deleteCommentById(Number(commentId));

  res
    .status(StatusCodes.OK)
    .json(SUCCESS({ message: "성공적으로 처리되었습니다." }));
});

// 팀 활동 로그 조회
const getTeamLogs = catchAsync(async (req: Request, res: Response) => {
  const { teamId } = req.params;

  if (!isValidId(teamId)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const logs = await findLogsByTeam(Number(teamId));

  res.status(StatusCodes.OK).json(SUCCESS(logs));
});

export {
  getTeamTasksData,
  getTasksByTeam,
  createTask,
  getTaskDetail,
  deleteTask,
  updateTaskStatus,
  createComment,
  updateComment,
  deleteComment,
  getTeamLogs,
};
