const functions = require('../functions.js');
const sql = require('../sql.js');

module.exports = async (client, guild) => {
  try {
    guild.db = await sql.loadGuild(guild.id);
    guild.infractions = await sql.loadInfractionCount(guild.id);
    guild.ready = true;

    functions.loadGuildHooks(client, guild);
  } catch { }
}