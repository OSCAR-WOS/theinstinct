const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = async (client, messages) => {
  const message = messages.first();
  if (!message.guild) return;

  messages.forEach((m) => {
    if (m.attachments.size > 0) {
      const attachment = m.attachments.first();
      if (!attachment.link && client.attachments[attachment.id]) attachment.link = client.attachments[attachment.id];
    }
  });

  if (message.author.banned && message.author.banned[message.guild.id]) {
    return functions.deletedUserMessages(message.author, message.guild, messages.array());
  }

  let audit;
  if (message.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    try {
      audit = await functions.fetchAuditLog(message.guild, 'MESSAGE_BULK_DELETE');
    } catch { }
  }

  let executor;
  if (audit) {
    executor = message.guild.member(audit.executor);
    if (executor && executor.id === client.user.id) return;
  }

  const members = [];
  messages.forEach((m) => {
    if (!members.includes(m.member)) members.push(m.member);
  });

  try {
    await log.send(message.guild, log.Type.MESSAGE_BULK_DELETE, {channel: message.channel, messages, members, executor});
  } catch { }
};
