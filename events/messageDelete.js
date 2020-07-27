const helper = require('../helper.js');
const log = require('../log.js');

module.exports = async (client, message) => {
  let executor = null;

  if (message.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try { executor = await checkAuditEntry(message); }
    catch { }
  }

  if (executor && executor.bot || message.botDelete) return;
  try { log.send(message.guild, { message: message, executor: executor }, log.Type.MESSAGE_DELETE); }
  catch { } 
}

function checkAuditEntry(message) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog = await helper.fetchAuditLog(message.guild, 'MESSAGE_DELETE');
      if (!auditLog) return resolve(null);

      let lastEntry = null;
      if (message.guild.hasOwnProperty('lastEntry')) lastEntry = message.guild.lastEntry;
      message.guild.lastEntry = auditLog;

      if (auditLog.target.id != message.author.id) return resolve(null);

      if (lastEntry) {
        if (lastEntry.id == auditLog.id && lastEntry.extra.count == auditLog.extra.count) return resolve(null);
        return resolve(auditLog.executor);
      }

      return resolve(auditLog.executor);
    } catch { resolve(null); }
  })
}