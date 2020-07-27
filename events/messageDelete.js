module.exports = (client, message) => {
  if (message.attachments.size > 0) console.log(message.attachments);
}