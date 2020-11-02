const log = require('../helpers/log.js');

module.exports = async (client, oldMessage, newMessage) => {
  if (!newMessage.member) return;
  if (newMessage.author.bot) return;

  newMessage.attachments = oldMessage.attachments;
  if (oldMessage.cleanContent === newMessage.cleanContent) return;
  if (!newMessage.changes) newMessage.changes = [];

  newMessage.changes.push(oldMessage);
  newMessage.createdTimestamp = Date.now();

  try {
    await log.send(newMessage.guild, log.Type.MESSAGE_UPDATE, {oldMessage, newMessage});
  } catch { }
};
