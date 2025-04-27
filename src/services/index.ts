export interface Student {
  username: string; // wuthout @ symbol
  name: string;
  coins: number;
  telegramId?: string;  // Optional since admin might register users who haven't used the bot
}

export class StudentService {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async getStudentByUsername(username: string): Promise<Student | null> {
    try {
      const student = await this.kv.get(username);
      return student ? JSON.parse(student) : null;
    } catch (error) {
      console.error('Error fetching student:', error);
      return null;
    }
  }

  async registerStudent(username: string, name: string, telegramId?: string): Promise<Student> {
    const student: Student = {
      username,
      name,
      coins: 0,
      telegramId
    };

    await this.kv.put(username, JSON.stringify(student));

    // Create an index by telegramId for easy lookup if provided
    if (telegramId) {
      await this.kv.put(`telegram:${telegramId}`, username);
    }

    return student;
  }

  async removeStudent(username: string): Promise<string> {
    try {
      const student = await this.getStudentByUsername(username);

      if (!student) {
        return `Student ${username} not found.`;
      }

      await this.kv.delete(username);
      return `Successfully removed @${student.username} (${student.name}).`;
    } catch (error) {
      console.error('Error removing student:', error);
      return `Error occurred while removing student ${username}.`;
    }
  }

  async addCoins(username: string, amount: number): Promise<Student | null> {
    const student = await this.getStudentByUsername(username);

    if (!student) {
      return null;
    }

    student.coins += amount;
    await this.kv.put(student.username, JSON.stringify(student));
    return student;
  }

  async getStudentByTelegramId(telegramId: string): Promise<Student | null> {
    try {
      const username = await this.kv.get(`telegram:${telegramId}`);

      if (!username) {
        return null;
      }

      return await this.getStudentByUsername(username);
    } catch (error) {
      console.error('Error fetching student by Telegram ID:', error);
      return null;
    }
  }

	async getStudentByName(name: string): Promise<Student | null> {
    try {
      const student = await this.kv.get(name);
      return student ? JSON.parse(student) : null;
    } catch (error) {
      console.error('Error fetching student:', error);
      return null;
    }
	}

	async getAllStudents(): Promise<Student[] | null> {
		const list = await this.kv.list({ limit: 100 });

		const studentsArray = await Promise.all(
			list.keys.map(async (key) => {
				const value = await this.kv.get(key.name);
				return value ? [key.name, JSON.parse(value)] : null;
			})
		);

		const students = Object.fromEntries(
			studentsArray.filter((entry): entry is [string, any] => entry !== null)
		);

    return Object.values(students) as Student[];
	}
}
