const log = require('../log.js');

module.exports = async (client, messages) => {
  let message = messages.first();

  try { log.send(message.guild, { channel: message.channel, messages: messages.array() }, log.Type.MESSAGE_BULK_DELETE); }
  catch { }
}