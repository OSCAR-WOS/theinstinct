const log = require('../helpers/log.js');

module.exports = (client, oldUser, newUser) => {
  if (oldUser.tag === newUser.tag) return;
  const guilds = client.guilds.cache.filter((guild) => guild.ready && guild.member(newUser));

  guilds.forEach(async (guild) => {
    const member = guild.member(newUser);

    try {
      await log.send(guild, log.Type.USERNAME_UPDATE, {member, oldUser});
    } catch { }
  });
};
