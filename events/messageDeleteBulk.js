const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');

const {Collection} = require('discord.js');

module.exports = async (client, messages) => {
  const message = messages.first();
  console.log(message);

  if (!message.guild) return;

  if (message.author.banned && message.author.banned[message.guild.id]) {
    if (!message.author.messages) message.author.messages = {};
    if (!message.author.messages[message.guild.id]) message.author.messages[message.guild.id] = new Collection();

    return messages.forEach((m) => {
      message.author.messages[message.guild.id].set(m.id, m);
    });
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
