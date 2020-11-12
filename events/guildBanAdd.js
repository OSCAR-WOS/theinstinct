const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = (client, guild, user) => {
  user.banned = {[guild.id]: true};

  const member = guild.member(user);
  member.banned = true;

  setTimeout(async (guild, member) => {
    const audit = await checkBanEntry(guild, member);

    try {
      await log.send(guild, log.Type.BAN, {member, executor: audit ? guild.member(audit.executor) : null, reason: audit.reason});
    } catch { }
  }, process.env.delay, guild, member);
};

checkBanEntry = async (guild, member) => {
  try {
    const auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
    if (!auditLog) return;

    const lastBanAudit = guild.audit.ban;
    guild.audit.ban = auditLog;

    if (auditLog.target.id !== member.id) return;
    if (lastBanAudit && lastBanAudit.id === auditLog.id) return;

    return auditLog;
  } catch {
    return;
  }
};
