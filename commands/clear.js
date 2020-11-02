const functions = require('../helpers/functions.js');

module.exports = {
  aliases: ['clear'],
  channel: ['text'],
  user: {permissions: ['MANAGE_MESSAGES'], target: ''},
  bot: {permissions: ['MANAGE_MESSAGES'], target: ''},
  translation: {usage: 'clear_usage', help: 'clear_help', help_brief: 'clear_help_brief', help_example: 'clear_help_example'},
  category: [functions.categoryType.MODERATION],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        await message.channel.bulkDelete(5);
      } catch (err) {
        reject(err);
      }
    });
  },
};
