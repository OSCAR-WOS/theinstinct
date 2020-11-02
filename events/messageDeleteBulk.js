const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = async (client, messages) => {
  const message = messages.first();
  if (message.member.banned) return message.member.messages = messages;

  let audit;
  if (message.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try {
      audit = await functions.fetchAuditLog(newMember.guild, 'MESSAGE_BULK_DELETE');
    } catch { }
  }

  if (audit) {
    const executor = message.guild.member(audit.executor);
    if (executor && executor.id === client.user.id) return;
  }

  const members = [];
  messages.forEach((m) => {
    if (!members.includes(m.member)) members.push(m.member);
  });

  try {
    await log.send(message.guild, log.Type.MESSAGE_BULK_DELETE, {channel: message.channel, messages, members});
  } catch { }
};
