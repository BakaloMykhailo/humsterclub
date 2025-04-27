
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

	console.log('Bot initialized with token:', TELEGRAM_API_KEY);

	// Explicitly initialize the bot
	await bot.init();

	bot.on('message', (ctx) => {
		console.log('Unhandled message:', ctx.message?.text);
		ctx.reply('Unknown command. Type /help to see available commands.');
	});

	console.log('Webhook received:', c.req);

  // Initialize student service
  const studentService = new StudentService(STUDENTS);


	console.log('Student service initialized:', studentService);

  // Set up commands through router
  studentRouter(bot, studentService);

  // Process the update
  try {
		console.log('Processing update...');
    const update = await c.req.json();
		console.log('Update:', update);
    await bot.handleUpdate(update);
  } catch (error) {
    console.error('Error processing update:', error);
  }

  return c.json({ status: 'success' });
});

export default app;
