const http = require('http');
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 8080);

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);
const scheduleData = JSON.parse(fs.readFileSync('./schedule.json', 'utf8'));

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

// Создаем кнопки, которые будут под сообщением
const inlineKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🔼 Верхняя неделя', 'show_upper')],
  [Markup.button.callback('🔽 Нижняя неделя', 'show_lower')]
]);

bot.start((ctx) => {
  ctx.reply('Привет! Выбери неделю. Я буду обновлять это сообщение, чтобы не засорять чат:', inlineKeyboard);
});

// Обработка нажатия на встроенную кнопку "Верхняя"
bot.action('show_upper', async (ctx) => {
  try {
    await ctx.editMessageText(formatWeek('upper'), {
      parse_mode: 'Markdown',
      ...inlineKeyboard
    });
  } catch (e) {
    // Если пользователь нажал на кнопку той же недели, которая уже открыта, Telegram выдаст ошибку. Игнорируем её.
    ctx.answerCbQuery();
  }
});

// Обработка нажатия на встроенную кнопку "Нижняя"
bot.action('show_lower', async (ctx) => {
  try {
    await ctx.editMessageText(formatWeek('lower'), {
      parse_mode: 'Markdown',
      ...inlineKeyboard
    });
  } catch (e) {
    ctx.answerCbQuery();
  }
});

// Старые команды теперь тоже будут вызывать новое сообщение с кнопками
bot.command('up_week', (ctx) => ctx.replyWithMarkdown(formatWeek('upper'), inlineKeyboard));
bot.command('low_week', (ctx) => ctx.replyWithMarkdown(formatWeek('lower'), inlineKeyboard));

bot.launch().then(() => console.log('🚀 Бот с авто-обновлением запущен!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));