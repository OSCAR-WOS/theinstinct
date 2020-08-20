const log = require('../log.js');

module.exports = async (client, guildMember) => {
  try {
    if (guildMember.hasOwnProperty('banned')) delete guildMember.banned;
    log.send(guildMember.guild, guildMember, log.Type.JOIN);
  } catch { }
}