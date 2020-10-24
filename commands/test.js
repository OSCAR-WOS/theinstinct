module.exports = {
  aliases: ['test'],
  channel: ['text'],
  userPermissions: ['MANAGE_GUILD'],
  botPermissions: ['MANAGE_CHANNELS'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      resolve(console.log('ran'));
    });
  },
};
