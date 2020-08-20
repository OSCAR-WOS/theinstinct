const functions = require('../functions.js');
const log = require('../log.js');

module.exports = async (client, guildMember) => {
  let guild = guildMember.guild;
  let log = null;

  if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try { log = await checkAudit(guild, guildMember, 'BAN'); }
    catch { }

    if (!log) {
      try { log = await checkAudit(guild, guildMember, 'KICK'); }
      catch { }
    }
  }

  console.log('1');

  try {
    if (!log) return log.send(guild, guildMember, log.Type.LEAVE);
    if (log.executor && log.executor.bot) return;

    console.log('2');
    //if (log.action === 'MEMBER_BAN')
  } catch (e) { console.error(e); }
}

function checkAudit(guild, guildMember, type) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog;

      if (type == 'BAN') auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
      else auditLog = await functions.fetchAuditLog(guild, 'MEMBER_KICK');
      if (!auditLog) return resolve(null);

      if (auditLog.target.id != guildMember.id) return resolve(null);
      return resolve(auditLog);
    } catch { resolve(null); }
  })
}