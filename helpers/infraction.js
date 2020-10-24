const Infraction = require('../classes/Infraction.js');

const Type = {
  BAN: 'ban',
  KICK: 'kick',
  MUTE: 'mute',
  PUNISH: 'punish',
  GAG: 'gag',
};

module.exports.new = (guild, type, data) => {
  return new Promise(async (resolve, reject) => {
    if (!guild.ready) return resolve();
  });
};

module.exports.Type = Type;
