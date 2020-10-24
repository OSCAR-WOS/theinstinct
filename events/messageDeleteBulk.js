const log = require('../helpers/log.js');

module.exports = async (client, messages) => {
  const message = messages.first();

  try {
    await log.send(message.guild, log.Type.MESSAGE_BULK_DELETE, {channel: message.channel, messages});
  } catch { }
};
