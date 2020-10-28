const functions = require('../helpers/functions.js');
const infraction = require('../helpers/infraction.js');
const log = require('../helpers/log.js');
const sql = require('../helpers/sql.js');

module.exports = (client, oldMember, newMember) => {
  if (!newMember.guild.ready) return;

  checkUsername(oldMember, newMember);
  checkRoles(oldMember, newMember);
};

checkUsername = async (oldMember, newMember) => {
  if (oldMember.displayName === newMember.displayName) return;
  let audit;

  if (newMember.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    audit = await checkUpdateEntry(newMember, false);
  }

  try {
    await log.send(newMember.guild, log.Type.NICKNAME_UPDATE, {oldMember, newMember, executor: audit ? newMember.guild.member(audit.executor) : null});
  } catch { }
};

checkRoles = async (oldMember, newMember) => {
  if (newMember.pending && [infraction.Type.MUTE, infraction.Type.PUNISH, infraction.Type.GAG].includes(newMember.pending)) return delete newMember.pending;

  const role = checkRoleDiff(oldMember.roles.cache, newMember.roles.cache);
  if (!role) return;

  const checkRole = checkGuildRole(newMember.guild, role);
  let audit;

  if (newMember.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try {
      audit = await functions.fetchAuditLog(newMember.guild, 'MEMBER_ROLE_UPDATE');
      if (audit.target.id !== newMember.id) audit = null;
    } catch { }
  }

  try {
    if (!checkRole) await log.send(newMember.guild, role.$add ? log.Type.ROLE_ADD : log.Type.ROLE_REMOVE, {member: newMember, role, executor: audit ? newMember.guild.member(audit.executor) : null});
    else await log.send(newMember.guild, checkTimedRole(checkRole, role.$add), {member: newMember, executor: audit ? newMember.guild.member(audit.executor) : null});
  } catch { }

  if (!checkRole) return;

  try {
    if (audit && role.$add) {
      const executor = newMember.guild.member(audit.executor);
      if (!executor || executor.user.bot) return;

      await infraction.send(newMember.guild, checkRole, {member: newMember, executor});
    } else if (role.$remove) {
      const infractions = await sql.findInfractions({guild: newMember.guild.id, member: newMember.id, type: checkRole, notExecuted: true});

      if (!Array.isArray(infractions)) clearTimedRoles(infractions);
      else infractions.forEach((i) => clearTimedRoles(i));
    }
  } catch { }
};

clearTimedRoles = (i) => {
  sql.updateInfraction(i._id, {executed: true});

  console.log('removing event');
  functions.removeTimedEvent(i);
};

checkRoleDiff = (oldRoles, newRoles) => {
  let diff = oldRoles.difference(newRoles);
  if (diff.size === 0) return null;

  diff = diff.first();
  if (oldRoles.has(diff.id)) return {$remove: diff};
  else return {$add: diff};
};

checkGuildRole = (guild, role) => {
  role = role.$add ? role.$add : role.$remove;

  if (guild.db.roles.mute === role.id) return infraction.Type.MUTE;
  if (guild.db.roles.punish === role.id) return infraction.Type.PUNISH;
  if (guild.db.roles.gag === role.id) return infraction.Type.GAG;

  return null;
};

checkTimedRole = (roleType, add) => {
  switch (roleType) {
    case infraction.Type.MUTE: {
      if (add) return log.Type.MUTE_ADD;
      return log.Type.MUTE_REMOVE;
    } case infraction.Type.PUNISH: {
      if (add) return log.Type.PUNISH_ADD;
      return log.Type.PUNISH_REMOVE;
    } case infraction.Type.GAG: {
      if (add) return log.Type.GAG_ADD;
      return log.Type.GAG_REMOVE;
    }
  }
};

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
