import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  findTasksByTeam,
  findTaskById,
  insertTask,
  deleteTaskById,
  insertComment,
  updateCommentById,
  existsCommentById,
  deleteCommentById,
  updateTaskStatusByTask,
} from "../repositories/taskRepository";
import pusher from "../config/pusher";
import { findLogsByTeam, insertLog } from "../repositories/logRepository";
import catchAsync, {
  ERROR,
  INVALID_STATUS_ERROR,
  SUCCESS,
} from "../utils/response";
import { isValidId, isValidString, isValidTitle } from "../utils/validators";

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

// 상태 변경 처리
const statusChange = async (
  taskId: number,
  userId: string,
  currentStatus: "Todo" | "Doing" | "Done" | "Checked",
  nextStatus: "Todo" | "Doing" | "Done" | "Checked",
  logMessage: string,
  teamId: number,
  taskNumber: number,
) => {
  const updated = await updateTaskStatusByTask(
    taskId,
    currentStatus,
    nextStatus,
  );

  if (!updated) {
    return null;
  }

  await insertLog({
    teamId,
    userId,
    taskId,
    actionType: "MOVE",
    message: logMessage,
  });
  await pusher.trigger(`team-${teamId}`, "task-status-updated", {
    taskId,
    taskNumber,
    status: nextStatus,
  });

  return updated;
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

  if (!isValidId(teamId) || !isValidTitle(title) || !isValidString(content)) {
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
  }

  res.status(StatusCodes.CREATED).json(SUCCESS(task));
});

// 테스크 상세 조회
const getTaskDetail = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const task = await findTaskById(Number(taskId));
  if (!task) {
    return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json(SUCCESS(task));
});

// 테스크 삭제
const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const task = req.taskInfo!; // findTaskOwner 대신
  const requesterId = req.user!.uuid;

  if (task.requester_id !== requesterId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  await deleteTaskById(task.id);
  res
    .status(StatusCodes.OK)
    .json(SUCCESS({ message: "성공적으로 삭제되었습니다." }));
});

// 테스크 상태 변경
// 수락 Todo → Doing (담당자)
const acceptTask = catchAsync(async (req: Request, res: Response) => {
  const task = req.taskInfo!;

  if (task.status !== "Todo") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(INVALID_STATUS_ERROR("Todo 상태에서만 수락할 수 있습니다."));
  }

  const userId = req.user!.uuid;
  if (task.worker_id !== userId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  const updated = await statusChange(
    task.id,
    userId,
    "Todo",
    "Doing",
    `#${task.task_number} 요청 수락(Doing)`,
    task.team_id,
    task.task_number,
  );

  if (!updated) {
    return res.status(StatusCodes.CONFLICT).json(ERROR.CONFLICT);
  }

  res.status(StatusCodes.OK).json(SUCCESS(updated));
});

// 제출 Doing → Done (담당자)
const submitTask = catchAsync(async (req: Request, res: Response) => {
  const task = req.taskInfo!;

  if (task.status !== "Doing") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(INVALID_STATUS_ERROR("Doing 상태에서만 제출할 수 있습니다."));
  }

  const userId = req.user!.uuid;
  if (task.worker_id !== userId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  const updated = await statusChange(
    task.id,
    userId,
    "Doing",
    "Done",
    `#${task.task_number} 완료 제출(Done)`,
    task.team_id,
    task.task_number,
  );

  if (!updated) {
    return res.status(StatusCodes.CONFLICT).json(ERROR.CONFLICT);
  }

  res.status(StatusCodes.OK).json(SUCCESS(updated));
});

// 승인 Done → Checked (요청자)
const confirmTask = catchAsync(async (req: Request, res: Response) => {
  const task = req.taskInfo!;

  if (task.status !== "Done") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(INVALID_STATUS_ERROR("Done 상태에서만 승인할 수 있습니다."));
  }

  const userId = req.user!.uuid;
  if (task.requester_id !== userId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  const updated = await statusChange(
    task.id,
    userId,
    "Done",
    "Checked",
    `#${task.task_number} 확인 완료(Checked)`,
    task.team_id,
    task.task_number,
  );

  if (!updated) {
    return res.status(StatusCodes.CONFLICT).json(ERROR.CONFLICT);
  }

  res.status(StatusCodes.OK).json(SUCCESS(updated));
});

// 반려 Done → Doing (요청자)
const rejectTask = catchAsync(async (req: Request, res: Response) => {
  const task = req.taskInfo!;

  if (task.status !== "Done") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(INVALID_STATUS_ERROR("Done 상태에서만 반려할 수 있습니다."));
  }

  const userId = req.user!.uuid;
  if (task.requester_id !== userId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  const updated = await statusChange(
    task.id,
    userId,
    "Done",
    "Doing",
    `#${task.task_number} 재수정 요청(Doing)`,
    task.team_id,
    task.task_number,
  );

  if (!updated) {
    return res.status(StatusCodes.CONFLICT).json(ERROR.CONFLICT);
  }

  res.status(StatusCodes.OK).json(SUCCESS(updated));
});

// 뎃글 작성
const createComment = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { content } = req.body;

  if (!isValidString(content)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
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
  const { my } = req.query;

  if (!isValidId(teamId)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  // userId 쿼리 파라미터가 있으면 해당 유저 로그만 조회
  const filterUserId = my === "true" ? req.user!.uuid : undefined;

  const logs = await findLogsByTeam(Number(teamId), filterUserId);
  res.status(StatusCodes.OK).json(SUCCESS(logs));
});

export {
  getTeamTasksData,
  getTasksByTeam,
  createTask,
  getTaskDetail,
  deleteTask,
  acceptTask,
  submitTask,
  confirmTask,
  rejectTask,
  createComment,
  updateComment,
  deleteComment,
  getTeamLogs,
};
