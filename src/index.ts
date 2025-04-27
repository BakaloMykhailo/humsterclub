
// src/index.ts
import { Hono } from 'hono';
import { Bot } from 'grammy';
import { studentRouter } from './routes';
import { StudentService } from './services';

interface Env {
  STUDENTS: KVNamespace;
  TELEGRAM_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post('/webhook', async (c) => {
  const { TELEGRAM_API_KEY, STUDENTS } = c.env;

  // Initialize bot with token from environment
  const bot = new Bot(TELEGRAM_API_KEY);

  // Initialize student service
  const studentService = new StudentService(STUDENTS);

  // Set up commands through router
  studentRouter(bot, studentService);

  // Process the update
  try {
    const update = await c.req.json();
    await bot.handleUpdate(update);
  } catch (error) {
    console.error('Error processing update:', error);
  }

  return c.json({ status: 'success' });
});

export default app;
