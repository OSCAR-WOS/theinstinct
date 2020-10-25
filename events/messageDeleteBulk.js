const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = async (client, messages) => {
  const message = messages.first();
  let audit;

  if (message.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try {
      audit = await functions.fetchAuditLog(newMember.guild, 'MEMBER_ROLE_UPDATE');
    } catch { }
  }

  if (audit) {
    const executor = message.guild.member(audit.executor);
    if (executor && executor.id === client.user.id) return;
  }

  try {
    await log.send(message.guild, log.Type.MESSAGE_BULK_DELETE, {channel: message.channel, messages});
  } catch { }
};
