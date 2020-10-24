const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = (client, guild, user) => {
  const member = guild.member(user);
  member.banned = true;

  setTimeout(async (guild, member) => {
    let audit = null;

    if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
      audit = await checkAuditEntry(guild, member);
    }

    try {
      await log.send(guild, log.Type.BAN, {member, executor: audit ? guild.member(audit.executor) : null, reason: audit.reason});
    } catch { }

    if (!audit) return;

    const executor = guild.member(audit.executor);
    if (!executor || executor.user.bot) return;

    /*
    try {
      await infraction.send(guild, { member, executor, reason: audit.reason }, infraction.Type.BAN);
    } catch { }
    */
  }, 1000, guild, member);
};

checkAuditEntry = (guild, member) => {
  return new Promise(async (resolve, reject) => {
    try {
      const auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
      if (!auditLog) return resolve(null);

      const lastBanAudit = guild.audit.ban;
      guild.audit.ban = auditLog;

      if (auditLog.target.id != member.id) return resolve(null);
      if (lastBanAudit && lastBanAudit.id == auditLog.id) return resolve(null);

      return resolve(auditLog);
    } catch {
      resolve(null);
    }
  });
};
