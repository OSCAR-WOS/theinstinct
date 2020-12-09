const constants = require('../helpers/constants.js');
const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = async (client, message) => {
  if (!message.guild || !message.guild.ready) return;
  if (message.author.id === client.user.id || message.botDelete) return;

  const audit = await checkDeleteEntry(message);

  try {
    await log.send(message.guild, constants.Log.MESSAGE_DELETE, {message, executor: audit ? message.guild.members.resolve(audit.executor) : null});
  } catch { }
};

checkDeleteEntry = async (message) => {
  const {guild} = message;
  let {author} = message;

  try {
    const auditLog = await functions.fetchAuditLog(guild, 'MESSAGE_DELETE');
    if (!auditLog) return;

    const audit = guild.audit.message;
    guild.audit.message = auditLog;

    if (message.webhookID && message.channel.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')) {
      const webhooks = await message.channel.fetchWebhooks();
      author = webhooks.get(message.webhookID).owner;
    }

    if (auditLog.target.id !== author.id) return;
    if (audit && audit.id === auditLog.id && audit.extra.count === auditLog.extra.count) return;

    return auditLog;
  } catch {
    return;
  }
};
