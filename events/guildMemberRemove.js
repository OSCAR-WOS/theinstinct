const functions = require('../functions.js');
const log = require('../log.js');

module.exports = async (client, guildMember) => {
  let guild = guildMember.guild;
  let log = null;

  if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try { log = await checkAuditBan(guild, guildMember); }
    catch { }

    if (!log) {
      try { log = await checkAuditKick(guild, guildMember); }
      catch { }
    }
  }

  try {
    if (!log) return log.send(guild, guildMember, log.Type.LEAVE);
    if (log.executor && log.executor.bot) return;

    console.log('check 1');
    //if (log.action === 'MEMBER_BAN')
  } catch { }
}

function checkAuditBan(guild, guildMember) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
      if (!auditLog) return resolve(null);

      if (auditLog.target.id != guildMember.id) return resolve(null);
      return resolve(auditLog);
    } catch { resolve(null); }
  })
}

function checkAuditKick(guild, guildMember) {
  return new Promise(async (resolve, reject) => {
    try {
      let auditLog = await functions.fetchAuditLog(guild, 'MEMBER_KICK');
      if (!auditLog) return resolve(null);

      if (auditLog.target.id != guildMember.id) return resolve(null);
      return resolve(auditLog);
    } catch { resolve(null); }
  })
}