const functions = require('../functions.js');
const log = require('../log.js');

module.exports = async (client, message) => {
  if (!message.member) return;

  let guild = message.guild;
  let audit = null;
  let executor = null;

  if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try { audit = await checkAuditEntry(guild, message); }
    catch { }
  }

  if (message.author.bot || message.botDelete) return;
  if (audit) executor = guild.member(audit.executor);

  try { log.send(guild, { message: message, executor: executor }, log.Type.MESSAGE_DELETE); }
  catch { } 
}

function checkAuditEntry(guild, message) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog = await functions.fetchAuditLog(guild, 'MESSAGE_DELETE');
      if (!auditLog) return resolve(null);

      let lastMessageAudit = null;
      if (guild.hasOwnProperty('lastMessageAudit')) lastMessageAudit = guild.lastMessageAudit;
      guild.lastMessageAudit = auditLog;

      if (auditLog.target.id != message.author.id) return resolve(null);

      if (lastMessageAudit) {
        if (lastMessageAudit.id == auditLog.id && lastMessageAudit.extra.count == auditLog.extra.count) return resolve(null);
      }

      return resolve(auditLog);
    } catch { resolve(null); }
  })
}