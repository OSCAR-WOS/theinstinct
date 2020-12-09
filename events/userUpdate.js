const constants = require('../helpers/constants.js');
const log = require('../helpers/log.js');

module.exports = async (client, oldUser, newUser) => {
  if (oldUser.tag === newUser.tag) return;

  for (const guild of client.guilds.cache) {
    const member = guild.member(newUser);
    if (!member) return;

    try {
      await log.send(guild, constants.Log.USERNAME_UPDATE, {oldUser, member});
    } catch { }
  }
};
