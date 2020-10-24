const functions = require('../helpers/functions.js');
const infraction = require('../helpers/infraction.js');
const log = require('../helpers/log.js');

module.exports = (client, guild, user) => {
  const member = guild.member(user);
  member.banned = true;

  setTimeout(async (guild, member) => {
    let audit;

    if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
      audit = await checkBanEntry(guild, member);
    }

    try {
      await log.send(guild, log.Type.BAN, {member, executor: audit ? guild.member(audit.executor) : null, reason: audit.reason});
    } catch { }

    if (!audit) return;
    const executor = guild.member(audit.executor);

    if (executor.user.bot) return;
    try {
      await infraction.send(member.guild, infraction.Type.BAN, {member, executor, reason: audit.reason});
    } catch { }
  }, 1000, guild, member);
};

checkBanEntry = (guild, member) => {
  return new Promise(async (resolve, reject) => {
    try {
      const auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
      if (!auditLog) return resolve();

      const lastBanAudit = guild.audit.ban;
      guild.audit.ban = auditLog;

      if (auditLog.target.id != member.id) return resolve();
      if (lastBanAudit && lastBanAudit.id == auditLog.id) return resolve();

      return resolve(auditLog);
    } catch {
      resolve();
    }
  });
};
