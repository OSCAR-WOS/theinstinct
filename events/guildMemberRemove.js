const functions = require('../helpers/functions.js');
const infraction = require('../helpers/infraction.js');
const log = require('../helpers/log.js');

module.exports = (client, member) => {
  setTimeout(async (member) => {
    if (member.banned) return;
    let audit = null;

    if (member.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
      audit = await checkKickEntry(member.guild, member);
    }

    if (!audit) {
      try {
        return await log.send(member.guild, log.Type.LEAVE, member);
      } catch { }
    }

    const executor = member.guild.member(audit.executor);
    try {
      await log.send(member.guild, log.Type.KICK, {member, executor, reason: audit.reason});
    } catch { }

    if (executor.user.bot) return;
    try {
      await infraction.send(member.guild, infraction.Type.KICK, {member, executor, reason: audit.reason});
    } catch { }
  }, 1000, member);
};

checkKickEntry = (guild, member) => {
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
