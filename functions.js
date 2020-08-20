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

module.exports.loadGuildHooks = async function(guild) {
  guild.hook = { logs: null, files: null }

  if (guild.db.logs.webhook.id != null) {
    try { guild.hook.log = await client.fetchWebhook(guild.db.logs.webhook.id, guild.db.logs.webhook.token);
    } catch { }
  }

  if (guild.db.files.webhook.id != null) {
    try { guild.hook.files = await client.fetchWebhook(guild.db.files.webhook.id, guild.db.files.webhook.token);
    } catch { }
  }
}