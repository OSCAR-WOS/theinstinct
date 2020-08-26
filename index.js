(async () => {
  try {
    const sql = require('./sql.js');

    const fs = require('fs');
    const Discord = require('discord.js');
    const client = new Discord.Client({ fetchAllMembers: true, partials: ['MESSAGE'] });
    module.exports = client;

    client.commands = new Discord.Collection();

    fs.readdir('./events/', (e, files) => {
      if (e) return console.err(e);
      files.forEach(file => {
        const event = require(`./events/${file}`);
        let eventName = file.split('.')[0];
        client.on(eventName, event.bind(null, client));
      })
    })

    fs.readdir('./commands/', (e, files) => {
      if (e) return console.error(e);
      files.forEach(file => {
        if (!file.endsWith('.js')) return;
        let props = require(`./commands/${file}`);
        props.command = file.split('.')[0];
        client.commands.set(props.command, props);
      }) 
    })

    fs.readdir('./guilds/', (e, files) => {
      if (e) return console.error(e);
      files.forEach(file => {
        if (!file.endsWith('.js')) return;
        require(`./guilds/${file}`);
      })
    })

    await sql.connect();
    client.login(process.env.TOKEN);
  } catch (e) { console.error(e); }
})();