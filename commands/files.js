module.exports = {
  aliases: ['files', 'attachments'],
  channel: ['text'],
  userPermissions: ['MANAGE_GUILD'],
  botPermissions: ['MANAGE_WEBHOOKS'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
       resolve(console.log('wow'));
    })
  }
}