const functions = require('../functions.js');
const sql = require('../sql.js');

module.exports = async (client) => {
  for (let guild of client.guilds.cache.values()) {
    try {
      guild.db = await sql.loadGuild(client, guild.id);
      guild.infractions = await sql.loadInfractionCount(guild.id);
      guild.ready = true;

      loadRecentAudits(guild);
      functions.loadGuildHooks(client, guild);

      loadMessages(guild);
    } catch { }
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

function loadMessages(guild) {
  let channels = guild.channels.cache.filter(channel => channel.type == 'text' && channel.permissionsFor(guild.me).has(['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY']));
  channels.forEach(async channel => {
    let messages = null;

    try { messages = await channel.messages.fetch({ limit: 100 });
    } catch { }
    if (!messages) return;

    messages = messages.filter(message => message.attachments.size > 0);
    messages.forEach(async message => {
      let attachment = message.attachments.first();
      let query = null;

      try { query = await sql.findAttachment(channel.id, attachment.id);
      } catch { }
      if (!query) return;

      console.log(query);

      attachment.link = { url: query[0].url }
    })
  })
}