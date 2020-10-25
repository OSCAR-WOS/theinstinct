const functions = require('../helpers/functions.js');
const infraction = require('../helpers/infraction.js');
const log = require('../helpers/log.js');

const util = require('util');

module.exports = {
  aliases: ['clear'],
  channel: ['text'],
  userPermissions: ['MANAGE_MESSAGES'],
  botPermissions: ['MANAGE_MESSAGES'],
  translation: {usage: 'clear_usage', help: 'clear_help', help_brief: 'clear_help_brief', help_example: 'clear_help_example'},
  category: [functions.categoryType.MODERATION],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {

      } catch (err) {
        reject(err);
      }
    });
  },
};
