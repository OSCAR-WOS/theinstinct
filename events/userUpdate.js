const constants = require('../helpers/constants.js');
const log = require('../helpers/log.js');

module.exports = (client, oldUser, newUser) => {
  if (oldUser.tag === newUser.tag) return;
  const guilds = client.guilds.cache.filter((guild) => guild && guild.ready && guild.member(newUser));

  guilds.forEach(async (guild) => {
    const member = guild.member(newUser);

    try {
      await log.send(guild, constants.Log.USERNAME_UPDATE, {oldUser, member});
    } catch { }
  });
};
