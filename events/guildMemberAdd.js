const log = require('../log.js');

module.exports = async (client, member) => {
  try {
    if (member.hasOwnProperty('banned')) delete member.banned;
    log.send(member.guild, member, log.Type.JOIN);
  } catch { }
}