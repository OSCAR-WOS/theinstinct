const functions = require('../functions/functions.js');
const sql = require('../functions/sql.js');

module.exports = async (client, guild) => {
  try {
    guild.db = await sql.loadGuild(client, guild.id);
    guild.infractions = await sql.loadInfractionCount(guild.id);
    guild.ready = true;

    functions.loadGuildHooks(client, guild);
  } catch { }
}