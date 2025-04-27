import { Bot } from 'grammy';
import { StudentService } from '../services';
import { ADMIN_NAMES } from '../../config';

export function studentRouter(bot: Bot, studentService: StudentService) {
	bot.command('start', async (ctx) => {
		const telegramId = ctx.from?.id.toString();

		if (!telegramId) {
			return ctx.reply('Could not identify your Telegram account.');
		}

		const isAdmin = ADMIN_NAMES.includes(ctx.from?.username ?? '');

		let helpMessage = 'Available commands:\n' + '/balance [username] - Check coin balance\n';

		if (isAdmin) {
			helpMessage +=
				'/register username Student Name - Register a new student\n' +
				'/addcoins username amount - Add coins to a student\n' +
				'/removeStudent username - Remove a student\n' +
				'/listAllStudents - List all students\n';
		}

		helpMessage += '/help - Show this help message';

		return ctx.reply(helpMessage);
	});

	bot.command('register', async (ctx) => {
		const telegramId = ctx.from?.id.toString();

		if (!telegramId) {
			return ctx.reply('Could not identify your Telegram account.');
		}

		if (!ADMIN_NAMES.includes(ctx.from?.username ?? '')) {
			return ctx.reply('Sorry, only administrators can register students.');
		}

		const args = ctx.message?.text?.split(' ').slice(1) || [];

		if (args.length < 2) {
			return ctx.reply('Usage: /register username Student Full Name');
		}

		let username = args[0];

		if (username.startsWith('@')) {
			username = username.slice(1); // Remove '@' if present
		}

		// Get the student's name (everything after the username)
		const name = args.slice(1).join(' ');

		try {
			// Check if student already exists
			const existingStudent = await studentService.getStudentByUsername(username);
			if (existingStudent) {
				return ctx.reply(`Student ${username} is already registered.`);
			}

			// Register new student
			const student = await studentService.registerStudent(username, name);
			return ctx.reply(`Successfully registered @${student.username} (${student.name}). Initial balance: ${student.coins} coins.`);
		} catch (error) {
			console.error('Error registering student:', error);
			return ctx.reply('Failed to register student. Please try again later.');
		}
	});

	// Command to add coins to a student (admin only)
	bot.command('addcoins', async (ctx) => {
		const telegramId = ctx.from?.id.toString();

		if (!telegramId) {
			return ctx.reply('Could not identify your Telegram account.');
		}

		if (!ADMIN_NAMES.includes(ctx.from?.username ?? '')) {
			return ctx.reply('Sorry, only administrators can add coins to students.');
		}

		const args = ctx.message?.text?.split(' ').slice(1) || [];

		if (args.length < 2) {
			return ctx.reply('Usage: /addcoins username [amount]');
		}

		let username = args[0];

		const amountStr = args[1];
		const amount = parseInt(amountStr, 10);

		if (isNaN(amount) || amount <= 0) {
			return ctx.reply('Please provide a valid positive number for the amount of coins.');
		}

		try {
			// Add coins to student
			const updatedStudent = await studentService.addCoins(username, amount);

			if (!updatedStudent) {
				return ctx.reply(`Student ${username} not found.`);
			}

			return ctx.reply(
				`Successfully added ${amount} coins to @${updatedStudent.username} (${updatedStudent.name}). New balance: ${updatedStudent.coins} coins.`
			);
		} catch (error) {
			console.error('Error adding coins:', error);
			return ctx.reply('Failed to add coins. Please try again later.');
		}
	});

	// Command to check balance - accessible to all users
	bot.command('balance', async (ctx) => {
		const args = ctx.message?.text?.split(' ').slice(1) || [];
		const telegramId = ctx.from?.id.toString();

		if (!telegramId) {
			return ctx.reply('Could not identify your Telegram account.');
		}

		try {
			// If username is provided, check that student's balance
			if (args.length > 0) {
				let username = args[0];
				let student = await studentService.getStudentByUsername(username);

				if (!student) {
					student = await studentService.getStudentByName(username);
				}

				if (!student) {
					return ctx.reply(`Student ${username} not found.`);
				}

				return ctx.reply(`${student.username} (${student.name})'s balance: ${student.coins} coins.`);
			}

			// If no arguments, check the balance of the student associated with this Telegram ID
			const student = await studentService.getStudentByTelegramId(telegramId);

			if (!student) {
				return ctx.reply('You have not been registered by an admin yet.');
			}

			return ctx.reply(`Your balance: ${student.coins} coins.`);
		} catch (error) {
			console.error('Error checking balance:', error);
			return ctx.reply('Failed to check balance. Please try again later.');
		}
	});

	bot.command('listAllStudents', async (ctx) => {
		const students = await studentService.getAllStudents();

		if (!students || students.length === 0) {
			return ctx.reply('No students found.');
		}

		const studentList = students.map((student) => {
			return `@${student.username} (${student.name}) - ${student.coins} coins `;
		}
		).join('\n');

		return ctx.reply(`List of all students:\n${studentList}`);
	});

	bot.command('removeStudent' , async (ctx) => {
		const args = ctx.message?.text?.split(' ').slice(1) || [];
		 const username = args[0];

		if (!username) {
			return ctx.reply('Usage: /removeStudent username');
		}

		if (!ADMIN_NAMES.includes(ctx.from?.username ?? '')) {
			return ctx.reply('Sorry, only administrators can remove students.');
		}

		try {
			const resultMessage = await studentService.removeStudent(username);

			return ctx.reply(resultMessage);
		} catch (error) {
			console.error('Error removing student:', error);
			return ctx.reply('Failed to remove student. Please try again later.');
		}

	});

	// Help command
	bot.command('help', async (ctx) => {
		const telegramId = ctx.from?.id.toString();

		if (!telegramId) {
			return ctx.reply('Could not identify your Telegram account.');
		}

		const isAdmin = ADMIN_NAMES.includes(ctx.from?.username ?? '');

		let helpMessage = 'Available commands:\n' + '/balance [username] - Check coin balance\n';

		if (isAdmin) {
			helpMessage +=
				'/register username Student Name - Register a new student\n' +
				'/addcoins username amount - Add coins to a student\n' +
				'/removeStudent username - Remove a student\n' +
				'/listAllStudents - List all students\n';
		}

		helpMessage += '/help - Show this help message';

		return ctx.reply(helpMessage);
	});

	// Handle unknown commands
	bot.on('message', (ctx) => {
		return ctx.reply('Unknown command. Type /help to see available commands.');
	});
}
