const constants = require('../helpers/constants.js');
const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = async (client, guild, user) => {
  if (user.banned && user.banned[guild.id]) delete user.banned[guild.id];
  const audit = await checkUnbanEntry(guild, user);

  try {
    await log.send(guild, constants.Log.UNBAN, {user, executor: audit ? guild.members.resolve(audit.executor) : null});
  } catch { }
};

checkUnbanEntry = async (guild, user) => {
  try {
    const auditLog = await functions.fetchAuditLog(guild, 'MEMBER_BAN_REMOVE');
    if (!auditLog) return;

    if (auditLog.target.id !== user.id) return;
    return auditLog;
  } catch {
    return;
  }
};
