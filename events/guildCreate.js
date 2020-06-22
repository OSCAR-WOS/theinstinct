const sql = require('../sql.js');

module.exports = async (client, guild) => {
  try {
    guild.db = await sql.loadGuild(client, guild.id);
    guild.ready = true;

    if (guild.db.log.webhook.id != null) guild.logHook = await client.fetchWebhook(guild.db.log.webhook.id, guild.db.log.webhook.token);
  } catch (e) { console.error(e); }
}