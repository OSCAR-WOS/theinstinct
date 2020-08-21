module.exports.logLengthCheck = function(string) {
  if (string.length < 500 && string.split('\n').length < 5) return true;
  return false;
}

module.exports.fetchAuditLog = function(guild, type) {
  return new Promise(async (resolve, reject) => {
    try {
      let log = await guild.fetchAuditLogs({ type: type, limit: 1 });
      resolve(log.entries.first());
    } catch (e) { reject(e); }
  })
}

module.exports.loadGuildHooks = async function(client, guild) {
  guild.hook = { logs: null, files: null }

  if (guild.db.logs.webhook.id != null) {
    try { guild.hook.logs = await client.fetchWebhook(guild.db.logs.webhook.id, guild.db.logs.webhook.token);
    } catch { }
  }

  if (guild.db.files.webhook.id != null) {
    try { guild.hook.files = await client.fetchWebhook(guild.db.files.webhook.id, guild.db.files.webhook.token);
    } catch { }
  }
}

module.exports.formatDisplayName = function(user, member) {
  let displayName = user.tag;

  if (member && user.username != member.displayName) displayName += ` [${member.displayName}]`;
  return displayName;
}