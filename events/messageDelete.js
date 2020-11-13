const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = async (client, message) => {
  if (!message.guild) return;
  if (message.author.bot || message.botDelete) return;

  const audit = await checkDeleteEntry(message);

  try {
    await log.send(message.guild, log.Type.MESSAGE_DELETE, {message, executor: audit ? message.guild.member(audit.executor) : null});
  } catch { }
};

checkDeleteEntry = async (message) => {
  try {
    const auditLog = await functions.fetchAuditLog(message.guild, 'MESSAGE_DELETE');
    if (!auditLog) return;

    const lastMessageAudit = message.guild.audit.message;
    message.guild.audit.message = auditLog;

    if (auditLog.target.id !== message.author.id) return;

    if (lastMessageAudit) {
      if (lastMessageAudit.id === auditLog.id && lastMessageAudit.extra.count === auditLog.extra.count) return;
    }

    return auditLog;
  } catch {
    return;
  }
};
