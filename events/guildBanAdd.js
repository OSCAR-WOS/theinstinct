const functions = require('../functions/functions.js');
const infraction = require('../functions/infraction.js');
const log = require('../functions/log.js');

module.exports = (client, guild, user) => {
  let member = guild.member(user);
  member.banned = true;

  setTimeout(async (guild, member) => {
    if (!member) return;
    let audit = null;

    if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
      try { audit = await checkAuditEntry(guild, member);
      } catch { }
    }

    if (!audit) return;
    let executor = guild.member(audit.executor);
    try { await log.send(guild, { member, executor, reason: audit.reason }, log.Type.BAN);
    } catch { }

    if (!executor || executor.user.bot) return;
    try { await infraction.send(guild, { member, executor, reason: audit.reason }, infraction.Type.BAN);
    } catch { }
  }, process.env.delay, guild, member)
}
 
function checkAuditEntry(guild, member) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
      if (!auditLog) return resolve(null);

      let lastBanAudit = guild.audit.ban;
      guild.audit.ban = auditLog;

      if (auditLog.target.id != member.id) return resolve(null);

      if (lastBanAudit) {
        if (lastBanAudit.id == auditLog.id) return resolve(null);
      }

      return resolve(auditLog);
    } catch { resolve(null); }
  })
}