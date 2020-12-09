const constants = require('../helpers/constants.js');
const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = (client, oldMember, newMember) => {
  if (!newMember.guild.ready) return;

  checkNickname(oldMember, newMember);
  checkRoles(oldMember, newMember);
};

checkNickname = async (oldMember, newMember) => {
  if (oldMember.displayName === newMember.displayName) return;
  const audit = await checkUpdateEntry(newMember.guild, newMember);

  try {
    await log.send(newMember.guild, constants.Log.NICKNAME_UPDATE, {oldMember, newMember, executor: audit ? newMember.guild.members.resolve(audit.executor) : null});
  } catch { }
};

checkRoles = async (oldMember, newMember) => {
  const role = checkRoleDiff(oldMember.roles.cache, newMember.roles.cache);
  if (!role) return;

  let audit;

  try {
    audit = await functions.fetchAuditLog(newMember.guild, 'MEMBER_ROLE_UPDATE');
    if (audit.target.id !== newMember.id) audit = null;
  } catch { }

  try {
    await log.send(newMember.guild, role.$add ? constants.Log.ROLE_ADD : constants.Log.ROLE_REMOVE, {member: newMember, role, executor: audit ? newMember.guild.members.resolve(audit.executor) : null});
  } catch { }
};

checkRoleDiff = (oldRoles, newRoles) => {
  const difference = oldRoles.difference(newRoles);
  if (difference.size === 0) return;

  const role = difference.first();

  if (oldRoles.has(role.id)) return {$remove: role};
  return {$add: role};
};

checkUpdateEntry = async (guild, member) => {
  try {
    const auditLog = await functions.fetchAuditLog(guild, 'MEMBER_UPDATE');
    if (!auditLog) return;

    if (auditLog.target.id !== member.id) return;
    if (auditLog.executor.id === member.id) return;

    return auditLog;
  } catch {
    return;
  }
};
