const { MongoClient } = require('mongodb');
var db;

var enabledModules = [ 'message_delete', 'message_update', 'message_bulk_delete', 'join', 'leave', 'ban', 'kick' ];

module.exports.connect = function() {
  return new Promise(async (resolve, reject) => {
    try {
      const mongoClient = new MongoClient(process.env.mongodb, { useNewUrlParser: true, useUnifiedTopology: true });
      let connection = await mongoClient.connect();
      db = connection.db('instinct');
      resolve();
    } catch (err) { reject(err); }
  })
}

module.exports.loadGuild = function(client, id) {
  return new Promise(async (resolve, reject) => {
    try {
      let guild = await findGuild(id);
      let values = { id: id, prefix: process.env.prefix, lang: process.env.lang, managers: [ process.env.owner ], commands: [], tags: [], logs: { channel: null, webhook: { id: null, token: null }}, files: { channel: null, webhook: { id: null, token: null }}, enabledModules: enabledModules }

      if (!guild) db.collection('guilds').insertOne(values);
      else values = guild;
      
      client.commands.forEach(async (command) => {
        if (!values.commands.find(com => com.command == command.command)) {
          values.commands.push({ command: command.command, aliases: command.aliases });
          await updateCommands(id, values.commands);
        }
      })

      resolve(values);
    } catch (e) { reject(e); }
  })
}

function findGuild(id) {
  return new Promise((resolve, reject) => {
    db.collection('guilds').findOne({ id: id }, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  })
}

function updateCommands(id, commands) {
  return new Promise((resolve, reject) => {
    db.collection('guilds').findOneAndUpdate({ id: id }, { $set: { commands: commands }}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  })
}