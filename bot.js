const http = require('http');
http.createServer((req, res) => {
  res.write('Bot is running!');
  res.end();
}).listen(process.env.PORT || 8080);

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Читаем JSON и проверяем его на ошибки
let scheduleData;
try {
    scheduleData = JSON.parse(fs.readFileSync('./schedule.json', 'utf8'));
} catch (err) {
    console.error('ОШИБКА В JSON ФАЙЛЕ:', err.message);
    process.exit(1);
}

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

const inlineKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🔼 Верхняя неделя', 'show_upper')],
  [Markup.button.callback('🔽 Нижняя неделя', 'show_lower')]
]);

bot.start((ctx) => {
  ctx.reply('Привет! Я обновился. Выбери неделю на кнопках:', inlineKeyboard);
});

bot.action('show_upper', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.editMessageText(formatWeek('upper'), { parse_mode: 'Markdown', ...inlineKeyboard });
  } catch (e) { console.log('Тот же текст'); }
});

bot.action('show_lower', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.editMessageText(formatWeek('lower'), { parse_mode: 'Markdown', ...inlineKeyboard });
  } catch (e) { console.log('Тот же текст'); }
});

bot.launch()
  .then(() => console.log('🚀 Бот запущен успешно!'))
  .catch((err) => console.error('Ошибка запуска:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));