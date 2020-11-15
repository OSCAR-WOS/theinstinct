const log = require('../helpers/log.js');

module.exports = async (client, member) => {
  if (member.banned) delete member.banned;

  try {
    await log.send(member.guild, log.Type.JOIN, member);
  } catch { }
};
