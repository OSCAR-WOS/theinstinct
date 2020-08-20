const functions = require('../functions.js');
const sql = require('../sql.js');

module.exports = async (client, guild) => {
  try {
    guild.db = await sql.loadGuild(client, guild.id);
    guild.ready = true;

    functions.loadGuildHooks(guild);
  } catch { }
}