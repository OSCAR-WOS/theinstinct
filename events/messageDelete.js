const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = async (client, message) => {
  if (!message.member) return;
  if (message.author.bot || message.botDelete) return;

  let audit = null;
  let executor = null;

  if (message.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    audit = await checkAuditEntry(message);
  }

  if (audit) executor = guild.member(audit.executor);

  try {
    await log.send(message.guild, log.Type.MESSAGE_DELETE, {message, executor});
  } catch { }
};

checkAuditEntry = (message) => {
  return new Promise(async (resolve, reject) => {
    try {
      const auditLog = await functions.fetchAuditLog(message.guild, 'MESSAGE_DELETE');
      if (!auditLog) return resolve(null);

      const lastMessageAudit = guild.audit.message;
      guild.audit.message = auditLog;

      if (auditLog.target.id !== message.author.id) return resolve(null);

      if (lastMessageAudit) {
        if (lastMessageAudit.id === auditLog.id && lastMessageAudit.extra.count === auditLog.extra.count) return resolve(null);
      }

      return resolve(auditLog);
    } catch {
      resolve(null);
    }
  });
};
