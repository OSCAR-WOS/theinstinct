const functions = require('../functions.js');
const log = require('../log.js');

module.exports = (client, guildMember) => {
  setTimeout(async (guildMember) => {
    if (guildMember.hasOwnProperty('banned')) return;

    let guild = guildMember.guild;
    let audit = null;
    
    if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
      try { audit = await checkAuditEntry(guild, guildMember); }
      catch { }
    }

    try {
      if (!audit) return log.send(guild, guildMember, log.Type.LEAVE);
      
      let executor = guild.member(audit.executor);
      if (!executor || executor && executor.bot) return;

      log.send(guild, { member: guildMember, executor: executor, reason: audit.reason }, log.Type.KICK);
    } catch { }
  }, 100, guildMember)
}

function checkAuditEntry(guild, member) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog = await functions.fetchAuditLog(guild, 'MEMBER_KICK');
      if (!auditLog) return resolve(null);

      let lastKickAudit = guild.audit.kick;
      guild.audit.kick = auditLog;

      if (auditLog.target.id != member.id) return resolve(null);

      if (lastKickAudit) {
        if (lastKickAudit.id == auditLog.id) return resolve(null);
      }

      return resolve(auditLog);
    } catch { resolve(null); }
  })
}