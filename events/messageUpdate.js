const constants = require('../helpers/constants.js');
const log = require('../helpers/log.js');

module.exports = async (client, oldMessage, newMessage) => {
  if (!newMessage.guild || !newMessage.guild.ready) return;

  const {author, attachments, cleanContent} = oldMessage;
  if (author.bot) return;

  newMessage.attachments = attachments;
  if (cleanContent === newMessage.cleanContent) return;

  if (!newMessage.changes) newMessage.changes = [];
  newMessage.changes.push(oldMessage);
  newMessage.createdTimestamp = Date.now();

  try {
    await log.send(newMessage.guild, constants.Log.MESSAGE_UPDATE, {oldMessage, newMessage});
  } catch { }
};
