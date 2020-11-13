const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = (client, oldMember, newMember) => {
  if (!newMember.guild.ready) return;

  checkUsername(oldMember, newMember);
  checkRoles(oldMember, newMember);
};

checkUsername = async (oldMember, newMember) => {
  if (oldMember.displayName === newMember.displayName) return;
  const audit = checkUpdateEntry(newMember, false);

  try {
    await log.send(newMember.guild, log.Type.NICKNAME_UPDATE, {oldMember, newMember, executor: audit ? newMember.guild.member(audit.executor) : null});
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
    await log.send(newMember.guild, role.$add ? log.Type.ROLE_ADD : log.Type.ROLE_REMOVE, {member: newMember, role, executor: audit ? newMember.guild.member(audit.executor) : null});
  } catch { }
};

checkRoleDiff = (oldRoles, newRoles) => {
  let diff = oldRoles.difference(newRoles);
  if (diff.size === 0) return null;

  diff = diff.first();
  if (oldRoles.has(diff.id)) return {$remove: diff};
  else return {$add: diff};
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

/*
checkUpdateEntry = (member, checkPast = true) => {
  return new Promise(async (resolve, reject) => {
    try {
      const auditLog = await functions.fetchAuditLog(member.guild, 'MEMBER_UPDATE');
      if (!auditLog) return resolve();

      if (auditLog.target.id !== member.id) return resolve();

      if (checkPast) {
        const lastUpdateAudit = member.guild.audit.update;
        member.guild.audit.update = auditLog;

        if (lastUpdateAudit && lastUpdateAudit.id === auditLog.id) return resolve();
      } else if (auditLog.executor.id === member.id) return resolve();

      return resolve(auditLog);
    } catch (err) {
      resolve();
    }
  });
};
*/
