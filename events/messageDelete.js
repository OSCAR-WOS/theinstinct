module.exports = (client, message) => {
  message.attachments.forEach(attachment => console.log(attachment));
}