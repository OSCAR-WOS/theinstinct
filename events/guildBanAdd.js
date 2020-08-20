const functions = require('../functions.js');
const log = require('../log.js');

module.exports = async (client, guild, user) => {
  let member = guild.member(user);
  if (!member) return;

  console.log('1');

  let audit = null;
  member.banned = true;

  if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try { audit = await checkAuditEntry(guild, guildMember); }
    catch { }
  }

  console.log('2');

  if (!audit) return;

  console.log('3');

  try {
    let executor = guild.member(audit.executor);
    if (!executor || executor && executor.bot) return;

    console.log('4');
    log.send(guild, { member: member, executor: executor, reason: audit.reason }, log.Type.BAN);
  } catch { }
}

function checkAuditEntry(guild, member) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('aaaa');
      let auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
      if (!auditLog) return resolve(null);
      return resolve(auditLog);

      /*

      console.log('a');

      let lastBanAudit = null;
      if (guild.hasOwnProperty('lastBanAudit')) lastBanAudit = guild.lastBanAudit;
      guild.lastBanAudit = auditLog;

      console.log('b');

      if (auditLog.target.id != member.id) return resolve(null);

      if (lastBanAudit) {
        console.log('c');
        if (lastBanAudit.id == auditLog.id) return resolve(null);
        
        console.log('d');
      }

      console.log('e');

      return resolve(auditLog);
      */
    } catch { resolve(null); }
  })
}