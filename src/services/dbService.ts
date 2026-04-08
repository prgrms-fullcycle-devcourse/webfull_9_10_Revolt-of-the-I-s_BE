import { withTransaction } from "../utils/transaction";
import {
  insertTeamWithClient,
  insertTeamMemberWithClient,
  deleteTeamMemberWithClient,
  countTeamMembersWithClient,
  removeTeamWithClient,
} from "../repositories/teamRepository";

// 팀 생성 트랜잭션
export const createTeamWithMember = async (data: {
  name: string;
  pin_password: string;
  owner_id: string;
}) => {
  return await withTransaction(async (client) => {
    const team = await insertTeamWithClient(client, data);
    await insertTeamMemberWithClient(client, {
      team_id: team.id,
      user_id: data.owner_id,
    });
    return team;
  });
};

// 팀 탈퇴 트랜잭션 (멤버 0명이면 팀 자동 삭제)
export const leaveTeamTransaction = async (teamId: number, userId: string) => {
  await withTransaction(async (client) => {
    await deleteTeamMemberWithClient(client, teamId, userId);

    const memberCount = await countTeamMembersWithClient(client, teamId);
    if (memberCount === 0) {
      await removeTeamWithClient(client, teamId);
    }
  });
};