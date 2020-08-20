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