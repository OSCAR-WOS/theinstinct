const functions = require('../functions.js');
const log = require('../log.js');

module.exports = (client, guild, user) => {
  let member = guild.member(user);

  setTimeout(async (guild, member) => {
    if (!member) return;
    console.log(member.id);

    let audit = null;
    member.banned = true;
    
    if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
      try { audit = await checkAuditEntry(guild, member); }
      catch (e) { console.error(e); }
    }

    console.log(audit);
    if (!audit) return;

    try {
      let executor = guild.member(audit.executor);
      if (!executor || executor && executor.bot) return;

      log.send(guild, { member: member, executor: executor, reason: audit.reason }, log.Type.BAN);
    } catch { }
  }, 100, guild, member)
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