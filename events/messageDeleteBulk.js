const constants = require('../helpers/constants.js');
const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

module.exports = async (client, messages) => {
  const message = messages.first();
  if (!message.guild) return;

  const members = [];
  for (const m of messages.values()) {
    if (!members.includes(m.member)) members.push(m.member);

    for (const attachment of m.attachments.values()) {
      if (!attachment.link && client.attachments[attachment.id]) attachment.link = client.attachments[attachment.id];
    }
  }

  if (message.author.banned && message.author.banned[message.guild.id]) {
    if (!message.author.messages) message.author.messages = {};
    if (message.author.messages[message.guild.id]) return message.author.messages[message.guild.id] = message.author.messages[message.guild.id].concat(messages);
    return message.author.messages[message.guild.id] = messages;
  }

  let audit;
  try {
    audit = await functions.fetchAuditLog(message.guild, 'MESSAGE_BULK_DELETE');
  } catch { }

  let executor;
  if (audit) {
    executor = message.guild.member(audit.executor);
    if (executor && executor.id === client.user.id) return;
  }

  try {
    await log.send(message.guild, constants.Log.MESSAGE_BULK_DELETE, {channel: message.channel, messages, members, executor});
  } catch { }
};
