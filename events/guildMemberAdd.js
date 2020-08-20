const log = require('../log.js');

module.exports = async (client, guildMember) => {
  try {
    log.send(guildMember.guild, guildMember, log.Type.JOIN);
  } catch { }
}