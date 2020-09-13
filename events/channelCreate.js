const functions = require('../functions/functions.js');

module.exports = async (client, channel) => {
  if (!channel.guild) return;

  try { await functions.channelPermissions(channel);
  } catch { }
}