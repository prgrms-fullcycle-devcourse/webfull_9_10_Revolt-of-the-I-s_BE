import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync, { ERROR, SUCCESS } from "../utils/response";
import { isValidId } from "../utils/validators";
import {
  findNotificationsByUser,
  findUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  countUnreadNotifications,
} from "../repositories/notificationRepository";
import pusher from "../config/pusher";

// 내 알림 전체 조회
export const getNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.uuid;
    const notifications = await findNotificationsByUser(userId);
    res.status(StatusCodes.OK).json(SUCCESS(notifications));
  },
);

// 읽지 않은 알림만 조회
export const getUnreadNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.uuid;
    const notifications = await findUnreadNotifications(userId);
    const count = await countUnreadNotifications(userId);
    res.status(StatusCodes.OK).json(SUCCESS({ count, notifications }));
  },
);

// 알림 읽음 처리
export const readNotification = catchAsync(
  async (req: Request, res: Response) => {
    const { notificationId } = req.params;
    const userId = req.user!.uuid;

    if (!isValidId(notificationId)) {
      return res.status(StatusCodes.BAD_REQUEST).json(ERROR.INVALID_ID);
    }

    const success = await markNotificationAsRead(
      Number(notificationId),
      userId,
    );
    if (!success) {
      return res.status(StatusCodes.NOT_FOUND).json(ERROR.NOT_FOUND);
    }

    res
      .status(StatusCodes.OK)
      .json(SUCCESS({ message: "읽음 처리되었습니다." }));
  },
);

// 전체 읽음 처리
export const readAllNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.uuid;
    await markAllNotificationsAsRead(userId);
    res
      .status(StatusCodes.OK)
      .json(SUCCESS({ message: "전체 읽음 처리되었습니다." }));
  },
);
