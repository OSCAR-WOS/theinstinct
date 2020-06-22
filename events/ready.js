const sql = require('../sql.js');

module.exports = async (client) => {
  for (let guild of client.guilds.cache.values()) {
    try {
      guild.db = await sql.loadGuild(client, guild.id);
      guild.ready = true;

      if (guildQuery.log.webhook.id != null) guild.logHook = await client.fetchWebhook(guildQuery.log.webhook.id, guildQuery.log.webhook.token);
    } catch { }
  }

  console.log(`Ready to serve in ${client.channels.cache.size} channels on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users.`);
}