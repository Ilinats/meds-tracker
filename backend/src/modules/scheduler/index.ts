import scheduleRoutes from './routes';
import { ScheduleChecker } from './services/scheduleChecker';
import schedule from 'node-schedule';

export const SchedulerModule = {
  routes: scheduleRoutes,
  initialize: () => {
    schedule.scheduleJob('* * * * *', async () => {
      await ScheduleChecker.checkMedicineSchedules();
    });
    
    schedule.scheduleJob('0 0 * * *', async () => {
      await ScheduleChecker.checkLowStockAndExpiry();
    });
  }
};