const functions = require('../helpers/functions.js');

module.exports = async (client, guild) => {
  try {
    await functions.loadGuild(client, guild);
  } catch { }
};
