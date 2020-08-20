const functions = require('../functions.js');
const log = require('../log.js');

module.exports = async (client, guildMember) => {
  let guild = guildMember.guild;
  let audit = null;

  if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try {
      let banAudit = await checkAudit(guild, guildMember, 'MEMBER_BAN_ADD');
      let kickAudit = await checkAudit(guild, guildMember, 'MEMBER_KICK');

      if (banAudit && kickAudit) audit = banAudit.createdTimestamp > kickAudit.createdTimestamp ? banAudit : kickAudit;
      else if (banAudit) audit = banAudit;
      else if (kickAudit) audit = kickAudit;

      console.log(audit.action);

      

      if (audit) {
        let lastRemoveAudit = null;
        if (guild.hasOwnProperty('lastRemoveAudit')) lastRemoveAudit = guild.lastRemoveAudit;
        guild.lastRemoveAudit = audit;

        console.log(`1: ${guild.lastRemoveAudit.id}`);
        console.log(`2: ${audit.id}`);
        
        if (lastRemoveAudit) {
          console.log(`3: ${lastRemoveAudit.id}`)
          if (lastRemoveAudit.id == audit.id) audit = null;
        }
      }
    } catch (e) { console.error(e); }
  }

  try {
    if (!audit) return log.send(guild, guildMember, log.Type.LEAVE);

    console.log('1');
    
    let executor = guild.member(audit.executor);
    if (!executor || executor && executor.bot) return;

    log.send(guild, { member: guildMember, executor: executor, reason: audit.reason }, audit.action == 'MEMBER_BAN_ADD' ? log.Type.BAN : log.Type.KICK);
  } catch { }
}

function checkAudit(guild, guildMember, type) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog = await functions.fetchAuditLog(guild, type);
      if (!auditLog) return resolve(null);

      if (auditLog.target.id != guildMember.id) return resolve(null);
      return resolve(auditLog);
    } catch { resolve(null); }
  })
}