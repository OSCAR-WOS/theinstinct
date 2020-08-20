const functions = require('../functions.js');
const log = require('../log.js');

module.exports = async (client, guildMember) => {
  let guild = guildMember.guild;
  let audit = null;

  if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try { audit = await checkAudit(guild, guildMember, 'BAN'); }
    catch { }

    if (!audit) {
      try { audit = await checkAudit(guild, guildMember, 'KICK'); }
      catch { }
    }
  }

  console.log(audit);

  try {
    if (!audit) return log.send(guild, guildMember, log.Type.LEAVE);
    if (audit.executor && audit.executor.bot) return;
  } catch (e) { console.error(e); }
}

function checkAudit(guild, guildMember, type) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog;

      if (type == 'BAN') auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
      else auditLog = await functions.fetchAuditLog(guild, 'MEMBER_KICK');
      if (!auditLog) return resolve(null);

      let lastKickAudit = null;
      if (guild.hasOwnProperty('lastKickAudit')) lastKickAudit = guild.lastKickAudit;
      guild.lastKickAudit = auditLog;

      if (auditLog.target.id != guildMember.id) return resolve(null);

      if (lastKickAudit) {
        if (lastKickAudit.id == auditLog.id) return resolve(null);
        return resolve(auditLog);
      }

      return resolve(auditLog);
    } catch { resolve(null); }
  })
}