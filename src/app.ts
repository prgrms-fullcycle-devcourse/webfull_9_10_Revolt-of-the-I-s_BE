import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { setupSwagger } from './utils/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
setupSwagger(app);

app.get('/', (req: Request, res: Response) => {
  res.send('🚀 i-Station API Server is Running with pnpm!');
});

app.listen(PORT, () => {
  console.log(`
  ################################################
  🛡️  Server listening on port: ${PORT}
  ################################################
  `);
});