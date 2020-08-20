const functions = require('../functions.js');
const log = require('../log.js');

module.exports = async (client, guild, user) => {
  let member = guild.member(user);
  if (!member) return;

  let audit = null;
  member.banned = true;

  if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try { audit = await checkAuditEntry(guild, guildMember); }
    catch { }
  }

  if (!audit) return;

  try {
    let executor = guild.member(audit.executor);
    if (!executor || executor && executor.bot) return;

    log.send(guild, { member: guildMember, executor: executor, reason: audit.reason }, log.Type.BAN);
  } catch { }
}

function checkAuditEntry(guild, user) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
      if (!auditLog) return resolve(null);

      let lastBanAudit = null;
      if (guild.hasOwnProperty('lastBanAudit')) lastBanAudit = guild.lastBanAudit;
      guild.lastBanAudit = auditLog;

      if (auditLog.target.id != user.id) return resolve(null);

      if (lastBanAudit) {
        if (lastBanAudit.id == auditLog.id) return resolve(null);
      }

      return resolve(auditLog);
    } catch { resolve(null); }
  })
}