const http = require('http');
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 8080);

require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');

// Инициализируем бота из .env файла
const bot = new Telegraf(process.env.BOT_TOKEN);

// Загружаем данные из твоего schedule.json
const scheduleData = JSON.parse(fs.readFileSync('./schedule.json', 'utf8'));

// Твой алгоритм форматирования (адаптированный)
function formatWeek(weekType) {
  const weekTitle = weekType === 'upper' ? scheduleData.week_title_upper : scheduleData.week_title_lower;
  let result = `📅 *${weekTitle}*\n\n`;
  
  scheduleData.days.forEach(day => {
    const lessons = weekType === 'upper' ? day.upper : day.lower;
    
    if (!lessons || lessons.length === 0) return;
    
    result += `━━━━━━━━━━━━━━━━━━━━\n`;
    result += `📆 *${day.day} (${day.date})*\n`;
    result += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    lessons.forEach(lesson => {
      const teacher = lesson.teacher || '—';
      const room = lesson.room || '—';
      
      result += `🕐 *${lesson.time}* → ${lesson.subject}\n`;
      result += `👨‍🏫 ${teacher} | 🚪 ${room}\n\n`;
    });
  });
  
  return result;
}

// Команды для бота
bot.command('up_week', (ctx) => {
  ctx.replyWithMarkdown(formatWeek('upper'));
});

bot.command('low_week', (ctx) => {
  ctx.replyWithMarkdown(formatWeek('lower'));
});

// Подсказка при старте
bot.start((ctx) => {
  ctx.reply('Привет! Используй команды /up_week или /low_week, чтобы получить расписание.');
});

// Запуск
bot.launch().then(() => {
  console.log('🚀 Бот запущен! Напиши ему в Telegram.');
});

// Остановка для безопасности
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));