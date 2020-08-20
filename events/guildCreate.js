const sql = require('../sql.js');

module.exports = async (client, guild) => {
  guild.logHook = null;

  try {
    guild.db = await sql.loadGuild(client, guild.id);
    guild.ready = true;

    if (guild.db.log.webhook.id != null) guild.logHook = await client.fetchWebhook(guild.db.log.webhook.id, guild.db.log.webhook.token);
  } catch { }
}