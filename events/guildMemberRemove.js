const functions = require('../functions.js');
const log = require('../log.js');

module.exports = (client, member) => {
  setTimeout(async (member) => {
    if (member.hasOwnProperty('banned')) return;

    let guild = member.guild;
    let audit = null;
    
    if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
      try { audit = await checkAuditEntry(guild, member);
      } catch { }
    }

    try {
      if (!audit) return log.send(guild, member, log.Type.LEAVE);
      
      let executor = guild.member(audit.executor);
      if (!executor || executor && executor.user.bot) return;

      log.send(guild, { member: member, executor: executor, reason: audit.reason }, log.Type.KICK);
    } catch { }
  }, process.env.delay, member)
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