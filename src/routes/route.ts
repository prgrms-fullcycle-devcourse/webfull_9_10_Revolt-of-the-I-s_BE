import { Router } from 'express';
import authRouter from './auth';
import usersRouter from './users';
import teamsRouter from './teams';
import tasksRouter from './tasks';
import archivesRouter from './archives';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/teams', teamsRouter);
router.use(tasksRouter);
router.use(archivesRouter);

export default router;
