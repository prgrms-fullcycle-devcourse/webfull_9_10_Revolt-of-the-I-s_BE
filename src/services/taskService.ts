import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  findTasksByTeam,
  findTaskById,
  insertTask,
  insertTaskWithClient,
  deleteTaskById,
  deleteTaskWithClient,
  insertComment,
  insertCommentWithClient,
  updateCommentById,
  existsCommentById,
  deleteCommentById,
  updateTaskStatusByTask,
  updateTaskStatusWithClient,
  updateTaskById,
  updateTaskWithClient,
} from "../repositories/taskRepository";
import pusher from "../config/pusher";
import {
  findLogsByTeam,
  insertLog,
  insertLogWithClient,
} from "../repositories/logRepository";
import catchAsync, {
  ERROR,
  INVALID_STATUS_ERROR,
  SUCCESS,
} from "../utils/response";
import { isValidId, isValidString, isValidTitle } from "../utils/validators";
import {
  insertNotification,
  insertNotificationWithClient,
} from "../repositories/notificationRepository";
import { withTransaction } from "../config/db";
import { findTeamByTeamId } from "../repositories/teamRepository";

interface TaskQuantity {
  Todo: number;
  Doing: number;
  Done: number;
  Checked: number;
}

const getTeamNameOrNull = async (teamId: number): Promise<string | null> => {
  const team = await findTeamByTeamId(teamId);
  return team?.name ?? null;
};

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

// =============================================
// 상태 변경 처리 - withTransaction으로 묶음
// 상태 변경 + 로그 생성이 하나의 트랜잭션으로 처리됨
// 상태 변경은 성공했는데 로그 저장 실패하는 불일치 방지
// =============================================
const statusChange = async (
  taskId: number,
  userId: string,
  currentStatus: "Todo" | "Doing" | "Done" | "Checked",
  nextStatus: "Todo" | "Doing" | "Done" | "Checked",
  logMessage: string,
  teamId: number,
  taskNumber: number,
) => {
  // 트랜잭션으로 상태변경 + 로그 생성을 묶음
  const updated = await withTransaction(async (client) => {
    // 1. task 상태 변경
    const result = await updateTaskStatusWithClient(
      client,
      taskId,
      currentStatus,
      nextStatus,
    );

    if (!result) return null;

    // 2. 로그 생성 (상태 변경과 반드시 함께 저장되어야 함)
    await insertLogWithClient(client, {
      teamId,
      userId,
      taskId,
      actionType: "MOVE",
      message: logMessage,
    });

    return result;
  });

  if (!updated) return null;

  // pusher는 DB 작업이 아니므로 트랜잭션 밖에서 실행
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

// =============================================
// 테스크 생성 - withTransaction으로 묶음
// task 생성 + 로그 생성 + 알림 생성이 하나의 트랜잭션으로 처리됨
// task는 만들어졌는데 로그/알림 저장 실패하는 불일치 방지
// =============================================
const createTask = catchAsync(async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { title, content, worker_id } = req.body;

  if (!isValidId(teamId) || !isValidTitle(title) || !isValidString(content)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const requesterId = req.user!.uuid;

  // 트랜잭션으로 task 생성 + 로그 생성 + 알림 생성을 묶음
  const task = await withTransaction(async (client) => {
    // 1. task 생성
    const newTask = await insertTaskWithClient(client, {
      teamId: Number(teamId),
      title: title.trim(),
      content: content.trim(),
      requesterId,
      workerId: worker_id ? String(worker_id) : null,
    });

    // 2. 로그 생성 (task 생성과 반드시 함께 저장되어야 함)
    await insertLogWithClient(client, {
      teamId: newTask.team_id,
      userId: requesterId,
      taskId: newTask.id,
      actionType: "CREATE",
      message: `#${newTask.task_number} 요청 발행(Todo)`,
    });

    // 3. 담당자가 있을 경우 알림 생성 (task, 로그와 반드시 함께 저장되어야 함)
    if (newTask.worker_id) {
      await insertNotificationWithClient(client, {
        userId: newTask.worker_id,
        teamId: newTask.team_id,
        taskId: newTask.id,
        type: "NEW_TASK",
        message: `🔔 #${newTask.task_number} 새로운 요청이 있습니다: ${newTask.title}`,
      });
    }

    return newTask;
  });

  const teamName = await getTeamNameOrNull(task.team_id);

  // 팀 전체 칸반 보드에 task 생성 실시간 반영
  await pusher.trigger(`team-${task.team_id}`, "task-created", {
    taskId: task.id,
    taskNumber: task.task_number,
    teamId: task.team_id,
    teamName,
  });

  // 담당자에게 개인 알림
  if (task.worker_id) {
    await pusher.trigger(`user-${task.worker_id}`, "new-task-requested", {
      message: `🔔 새로운 요청이 있습니다: ${task.title}`,
      taskId: task.id,
      taskNumber: task.task_number,
      teamId: task.team_id,
      teamName,
    });

    await pusher.trigger(`user-${task.worker_id}`, "new-notification", {
      type: "NEW_TASK",
      message: `🔔 #${task.task_number} 새로운 요청이 있습니다: ${task.title}`,
      taskId: task.id,
      teamId: task.team_id,
      teamName,
    });
  }

  res.status(StatusCodes.CREATED).json(SUCCESS(task));
});

// =============================================
// 테스크 수정 (요청자만 가능) - withTransaction으로 묶음
// task 수정 + 로그 생성 + 알림 생성이 하나의 트랜잭션으로 처리됨
// task는 수정됐는데 로그/알림 저장 실패하는 불일치 방지
// =============================================
const updateTask = catchAsync(async (req: Request, res: Response) => {
  const task = req.taskInfo!;
  const { title, content, worker_id } = req.body;
  const requesterId = req.user!.uuid;

  if (task.requester_id !== requesterId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  if (title && !isValidTitle(title)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }
  if (content && !isValidString(content)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  // 트랜잭션으로 task 수정 + 로그 생성 + 알림 생성을 묶음
  const updated = await withTransaction(async (client) => {
    // 1. task 수정
    const result = await updateTaskWithClient(client, task.id, {
      title: title?.trim(),
      content: content?.trim(),
      worker_id: worker_id ?? undefined,
    });

    // 2. 로그 생성 (task 수정과 반드시 함께 저장되어야 함)
    await insertLogWithClient(client, {
      teamId: task.team_id,
      userId: requesterId,
      taskId: task.id,
      actionType: "UPDATE",
      message: `#${task.task_number} 요청 수정`,
    });

    // 3. 담당자가 있을 경우 알림 생성 (task, 로그와 반드시 함께 저장되어야 함)
    if (task.worker_id) {
      await insertNotificationWithClient(client, {
        userId: task.worker_id,
        teamId: task.team_id,
        taskId: task.id,
        type: "TASK_UPDATED",
        message: `🚨 #${task.task_number} 요청이 수정되었습니다.`,
      });
    }

    return result;
  });

  const teamName = await getTeamNameOrNull(task.team_id);

  // 팀 전체 칸반 보드에 task 수정 실시간 반영
  await pusher.trigger(`team-${task.team_id}`, "task-updated", {
    taskId: task.id,
    taskNumber: task.task_number,
    teamId: task.team_id,
    teamName,
  });

  // 담당자에게 개인 알림
  if (task.worker_id) {
    await pusher.trigger(`user-${task.worker_id}`, "new-notification", {
      type: "TASK_UPDATED",
      message: `🚨 #${task.task_number} 요청이 수정되었습니다.`,
      taskId: task.id,
      teamId: task.team_id,
       teamName,
    });
  }

  res.status(StatusCodes.OK).json(SUCCESS(updated));
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

// =============================================
// 테스크 삭제 - withTransaction으로 묶음
// task 삭제 + 로그 생성 + 알림 생성이 하나의 트랜잭션으로 처리됨
// task는 삭제됐는데 로그/알림 저장 실패하는 불일치 방지
// =============================================
const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const task = req.taskInfo!;
  const requesterId = req.user!.uuid;

  if (task.worker_id !== requesterId) {
    return res.status(StatusCodes.FORBIDDEN).json(ERROR.FORBIDDEN);
  }

  // 트랜잭션으로 task 삭제 + 로그 생성 + 알림 생성을 묶음
  await withTransaction(async (client) => {
    // 1. task 삭제 (soft delete - is_deleted = true)
    await deleteTaskWithClient(client, task.id);

    // 2. 로그 생성 (task 삭제와 반드시 함께 저장되어야 함)
    await insertLogWithClient(client, {
      teamId: task.team_id,
      userId: requesterId,
      taskId: task.id,
      actionType: "DELETE",
      message: `#${task.task_number} 요청 삭제`,
    });

    // 3. 요청자에게 알림 생성 (task, 로그와 반드시 함께 저장되어야 함)
    await insertNotificationWithClient(client, {
      userId: task.requester_id,
      teamId: task.team_id,
      taskId: task.id,
      type: "TASK_DELETED",
      message: `❌ #${task.task_number} 요청이 삭제되었습니다.`,
    });
  });

  const teamName = await getTeamNameOrNull(task.team_id);

  // 팀 전체 칸반 보드에 task 삭제 실시간 반영
  await pusher.trigger(`team-${task.team_id}`, "task-deleted", {
    taskId: task.id,
    taskNumber: task.task_number,
    teamId: task.team_id,
    teamName,
  });

  // 요청자에게 개인 알림
  await pusher.trigger(`user-${task.requester_id}`, "new-notification", {
    type: "TASK_DELETED",
    message: `❌ #${task.task_number} 요청이 삭제되었습니다.`,
    taskId: task.id,
    teamId: task.team_id,
    teamName,
  });

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

  await insertNotification({
    userId: task.requester_id,
    teamId: task.team_id,
    taskId: task.id,
    type: "STATUS_CHANGED",
    message: `🆗 #${task.task_number} 요청이 수락되었습니다.`,
  });

  const teamName = await getTeamNameOrNull(task.team_id);

  await pusher.trigger(`user-${task.requester_id}`, "new-notification", {
    type: "STATUS_CHANGED",
    message: `🆗 #${task.task_number} 요청이 수락되었습니다.`,
    taskId: task.id,
    teamId: task.team_id,
    teamName,
  });

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

  await insertNotification({
    userId: task.requester_id,
    teamId: task.team_id,
    taskId: task.id,
    type: "STATUS_CHANGED",
    message: `✅ #${task.task_number} 요청이 완료 제출되었습니다.`,
  });

  const teamName = await getTeamNameOrNull(task.team_id);

  await pusher.trigger(`user-${task.requester_id}`, "new-notification", {
    type: "STATUS_CHANGED",
    message: `✅ #${task.task_number} 요청이 완료 제출되었습니다.`,
    taskId: task.id,
    teamId: task.team_id,
    teamName,
  });

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

  await insertNotification({
    userId: task.worker_id!,
    teamId: task.team_id,
    taskId: task.id,
    type: "STATUS_CHANGED",
    message: `👍 #${task.task_number} 요청이 최종 승인되었습니다.`,
  });

  const teamName = await getTeamNameOrNull(task.team_id);

  await pusher.trigger(`user-${task.worker_id!}`, "new-notification", {
    type: "STATUS_CHANGED",
    message: `👍 #${task.task_number} 요청이 최종 승인되었습니다.`,
    taskId: task.id,
    teamId: task.team_id,
    teamName,
  });

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

  await insertNotification({
    userId: task.worker_id!,
    teamId: task.team_id,
    taskId: task.id,
    type: "STATUS_CHANGED",
    message: `🙏 #${task.task_number} 요청이 반려되었습니다.`,
  });

  const teamName = await getTeamNameOrNull(task.team_id);

  await pusher.trigger(`user-${task.worker_id!}`, "new-notification", {
    type: "STATUS_CHANGED",
    message: `🙏 #${task.task_number} 요청이 반려되었습니다.`,
    taskId: task.id,
    teamId: task.team_id,
    teamName,
  });

  res.status(StatusCodes.OK).json(SUCCESS(updated));
});

// =============================================
// 댓글 작성 - withTransaction으로 묶음
// 댓글 저장 + 알림 생성이 하나의 트랜잭션으로 처리됨
// 댓글은 저장됐는데 알림 저장 실패하는 불일치 방지
// =============================================
const createComment = catchAsync(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { content } = req.body;

  if (!isValidString(content)) {
    return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
  }

  const userId = req.user!.uuid;
  const taskInfo = req.taskInfo!;

  // 본인 제외한 알림 수신 대상 (요청자 + 담당자)
  const recipients = [taskInfo.requester_id, taskInfo.worker_id].filter(
    (id) => id && id !== userId,
  );

  // 트랜잭션으로 댓글 저장 + 알림 생성을 묶음
  const comment = await withTransaction(async (client) => {
    // 1. 댓글 저장
    const newComment = await insertCommentWithClient(
      client,
      Number(taskId),
      userId,
      content.trim(),
    );

    // 2. 알림 생성 (요청자, 담당자 각각 - 본인 제외)
    for (const recipientId of recipients) {
      await insertNotificationWithClient(client, {
        userId: recipientId!,
        teamId: taskInfo.team_id,
        taskId: taskInfo.id,
        type: "NEW_COMMENT",
        message: `💬 #${taskInfo.task_number} 요청에 새로운 댓글이 달렸습니다.`,
      });
    }

    return newComment;
  });

  // pusher는 DB 작업이 아니므로 트랜잭션 밖에서 실행
  await pusher.trigger(`task-${taskId}`, "new-comment", comment);

  const teamName = await getTeamNameOrNull(taskInfo.team_id);

  for (const recipientId of recipients) {
    await pusher.trigger(`user-${recipientId}`, "new-notification", {
      type: "NEW_COMMENT",
      message: `💬 #${taskInfo.task_number} 요청에 새로운 댓글이 달렸습니다.`,
      taskId: taskInfo.id,
      teamId: taskInfo.team_id,
      teamName,
    });
  }

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
  updateTask,
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
