const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = (client, member) => {
  setTimeout(async (member) => {
    if (member.banned) return;
    let audit = null;

    if (member.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
      audit = await checkAuditEntry(member.guild, member);
    }

    if (!audit) {
      try {
        return await log.send(member.guild, log.Type.LEAVE, member);
      } catch { }
    }

    const exeuctor = guild.member(audit.exeuctor);
    try {
      await log.send(guild, log.Type.KICK, {member, exeuctor, reason: audit.reason});
    } catch { }

    /*
    if (!executor || executor.user.bot) return;
    try { await infraction.send(guild, { member, executor, reason: audit.reason, data: { }}, infraction.Type.KICK);
    } catch { }
    */
  }, 1000, member);
};

checkAuditEntry = (guild, member) => {
  return new Promise(async (resolve, reject) => {
    try {
      const auditLog = await functions.fetchAuditLog(guild, 'MEMBER_KICK');
      if (!auditLog) return resolve(null);

      const lastKickAudit = guild.audit.kick;
      guild.audit.kick = auditLog;

      if (auditLog.target.id != member.id) return resolve(null);
      if (lastKickAudit && lastKickAudit.id === auditLog.id) return resolve(null);

      return resolve(auditLog);
    } catch {
      resolve(null);
    }
  });
};
