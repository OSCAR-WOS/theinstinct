const log = require('../functions/log.js');

module.exports = async (client, member) => {
  try {
    if (member.banned) delete member.banned;
    log.send(member.guild, member, log.Type.JOIN);
  } catch { }
}