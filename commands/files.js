module.exports = {
  aliases: ['files', 'attachments'],
  channel: ['text'],
  userPermissions: ['MANAGE_GUILD'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
       console.log('wow');
    })
  }
}