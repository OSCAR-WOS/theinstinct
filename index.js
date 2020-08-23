(async () => {
  try {
    const sql = require('./sql.js');

    const fs = require('fs');
    const Discord = require('discord.js');
    const client = new Discord.Client({ fetchAllMembers: true });

    client.commands = new Discord.Collection();

    fs.readdir('./events/', (err, files) => {
      if (err) return console.err(err);
      files.forEach((file) => {
        const event = require(`./events/${file}`);
        let eventName = file.split(".")[0];
        client.on(eventName, event.bind(null, client));
      })
    })

    fs.readdir('./commands/', (err, files) => {
      if (err) return console.error(err);
      files.forEach((file) => {
        if (!file.endsWith(".js")) return;
        let props = require(`./commands/${file}`);
        props.command = file.split(".")[0];
        client.commands.set(props.command, props);
      })
    })

    await sql.connect();
    client.login(process.env.TOKEN);

    module.exports = client;
  } catch (e) { console.error(e); }
})();