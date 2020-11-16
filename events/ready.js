const functions = require('../helpers/functions.js');
const sql = require('../helpers/sql.js');

module.exports = async (client) => {
  for (const guild of client.guilds.cache.values()) {
    try {
      await functions.loadGuild(client, guild);
    } catch { }
  }

  sql.purgeAttachments();
  console.log(`Ready to serve in ${client.channels.cache.size} channels on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users`);
};
