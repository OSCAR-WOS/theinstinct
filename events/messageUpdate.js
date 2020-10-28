const log = require('../helpers/log.js');

module.exports = async (client, oldMessage, newMessage) => {
  if (!newMessage.member) return;
  if (newMessage.author.bot) return;

  if (oldMessage.cleanContent === newMessage.cleanContent) return;
  if (!newMessage.changes) newMessage.changes = [];

  newMessage.changes.push(oldMessage);
  newMessage.createdTimestamp = new Date();

  try {
    await log.send(newMessage.guild, log.Type.MESSAGE_UPDATE, {oldMessage, newMessage});
  } catch { }
};
