const constants = require('../helpers/constants.js');
const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = (client, member) => {
  setTimeout(async (member) => {
    if (member.banned) return;
    const audit = await checkKickEntry(member.guild, member);

    if (audit) {
      const executor = member.guild.member(audit.executor);

      try {
        await log.send(member.guild, constants.Log.KICK, {member, executor, reason: audit.reason});
      } catch { }
    } else {
      try {
        await log.send(member.guild, constants.Log.LEAVE, {member});
      } catch { }
    }
  }, process.env.delay, member);
};

checkKickEntry = async (guild, member) => {
  try {
    const auditLog = await functions.fetchAuditLog(guild, 'MEMBER_KICK');
    if (!auditLog) return;

    const lastKickAudit = guild.audit.kick;
    guild.audit.kick = auditLog;

    if (auditLog.target.id !== member.id) return;
    if (lastKickAudit && lastKickAudit.id === auditLog.id) return;

    return auditLog;
  } catch {
    return;
  }
};
