const log = require('../helpers/log.js');

module.exports = async (client, member) => {
  if (member.banned) delete member.banned;
  if (member.user.banned && member.user.banned[member.guild.id]) delete member.user.banned[member.guild.id];

  try {
    await log.send(member.guild, log.Type.JOIN, member);
  } catch { }
};
