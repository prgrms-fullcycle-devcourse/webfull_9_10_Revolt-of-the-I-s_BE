import cron from 'node-cron';
import { updateStatus } from '../../services/user.service';
import { cache } from '../../services/user.service';
export const startStatusScheduler = () => {

  cron.schedule('* * * * *', async () => {
    console.log("유저 상태 체크 중...");
    
    const userUuids = Array.from(cache.keys());
    
    for (const uuid of userUuids) {
      await updateStatus(uuid);
    }
  });
  
  console.log("상태 관리 완료.");
};