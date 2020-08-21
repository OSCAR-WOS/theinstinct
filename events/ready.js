const functions = require('../functions.js');
const sql = require('../sql.js');

module.exports = async (client) => {
  for (let guild of client.guilds.cache.values()) {
    try {
      guild.db = await sql.loadGuild(client, guild.id);
      guild.infractions = await sql.loadInfractionCount(guild.id);
      guild.ready = true;

      let test = await sql.findInfractions(guild.id);
      console.log(test);



      loadRecentAudits(guild);
      functions.loadGuildHooks(client, guild);
    } catch (e) { console.error(e); }
  }

  console.log(`Ready to serve in ${client.channels.cache.size} channels on ${client.guilds.cache.size} servers, for a total of ${client.users.cache.size} users.`);
}

async function loadRecentAudits(guild) {
  guild.audit = { kick: null, ban: null, message: null }

  try { guild.audit.kick = await functions.fetchAuditLog(guild, 'MEMBER_KICK');
  } catch { }

  try { guild.audit.ban = await functions.fetchAuditLog(guild, 'MEMBER_BAN_ADD');
  } catch { }

  try { guild.audit.message = await functions.fetchAuditLog(guild, 'MESSAGE_DELETE');
  } catch { }
}