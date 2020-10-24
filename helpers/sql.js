const Infraction = require('../classes/Infraction.js');
const functions = require('./functions.js');

const MongoClient = require('mongodb').MongoClient;
let database;

const modules = ['message_delete', 'message_update', 'message_bulk_delete', 'join', 'leave', 'ban', 'kick'];

module.exports.connect = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = new MongoClient(process.env.database, {useNewUrlParser: true, useUnifiedTopology: true});
      const connection = await client.connect();
      resolve(database = connection.db('instinct'));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.loadGuild = (client, id) => {
  let values = {
    id,
    prefix: process.env.prefix,
    language: process.env.language,
    commands: [],
    managers: [process.env.owner],
    logs: {channel: null, webhook: {id: null, token: null}},
    files: {channel: null, webhook: {id: null, token: null}},
    blogs: {channel: null, webhook: {id: null, token: null}},
    roles: {mute: null, punish: null, gag: null},
    enabledLogs: modules,
    cases: null,
    infractions: 0,
  };

  return new Promise(async (resolve, reject) => {
    try {
      const guild = await findGuild(id);
      let update;

      if (!guild) await database.collection('guilds').insertOne(values);
      else values = guild;

      client.commands.forEach((command) => {
        if (!values.commands.find((com) => com.command)) {
          if (!update) update = true;
          values.commands.push({command: command.command, aliases: command.aliases});
        }
      });

      if (update) await updateGuild(id, values);
      resolve(values);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.insertAttachment = (channel, id, url) => {
  return new Promise((resolve, reject) => {
    database.collection('attachments').insertOne({channel, id, url}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports.findAttachment = (channel, id) => {
  return new Promise((resolve, reject) => {
    database.collection('attachments').findOne({channel, id}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports.keepAttachment = (id) => {
  const query = {$set: {keep: true}};

  return new Promise((resolve, reject) => {
    database.collection('attachments').findOneAndUpdate({_id: id}, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports.purgeAttachments = () => {
  database.collection('attachments').deleteMany({keep: {$exists: false}}, (err, result) => {
    database.collection('attachments').updateMany({}, {$unset: {keep: ''}}, (err, results) => {});
  });
};

module.exports.insertInfraction = (guild, member, executor, type, expire, data = { }) => {
  const infraction = new Infraction(null, member.id, executor.id, guild.id, type, expire);
  infraction.data.name = functions.formatDisplayName(member.user, member);
  infraction.data.executorName = functions.formatDisplayName(executor.user, executor);

  if (data.reason) infraction.data.reasons.push({reason: data.reason, executor: executor.id});

  return new Promise(async (resolve, reject) => {
    try {
      infraction.id = await updateInfractionCount(guild);
      database.collection('infractions').insertOne(infraction, (err, result) => {
        if (err) reject(err);

        infraction._id = result.insertedId;
        resolve(infraction.resolveMini());
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.findInfractions = (data = { }) => {
  const query = { };

  if (data.id) query._id = data.id;
  if (data.case) query.id = data.case;
  if (data.guild) query.guild = data.guild;
  if (data.user) query.user = data.user;
  if (data.executor) query.executor = data.executor;
  if (data.executed) query['data.executed'] = {$exists: false};
  if (data.type) query['data.type'] = data.type;

  return new Promise((resolve, reject) => {
    database.collection('infractions').find(query).toArray((err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports.updateInfraction = (id, data = { }) => {
  const query = { };

  if (data.message) query.$set = {'data.message': data.message};
  if (data.executed) query.$set = {'data.executed': true};
  if (data.reason) query.$push = {reasons: {reason: data.reason, executor: data.executor}};

  return new Promise((resolve, reject) => {
    database.collection('infractions').findOneAndUpdate({_id: id}, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

findGuild = (id) => {
  return new Promise((resolve, reject) => {
    database.collection('guilds').findOne({id}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

updateGuild = (id, data = { }) => {
  const query = {$set: { }};

  if (data.prefix) query.$set.prefix = data.prefix;
  if (data.language) query.$set.language = data.language;
  if (data.commands) query.$set.commands = data.commands;
  if (data.managers) query.$set.managers = data.managers;
  if (data.roles) query.$set.roles = data.roles;
  if (data.enabledLogs) query.$set.enabledLogs = data.enabledLogs;
  if (data.cases) query.$set.cases = data.cases;

  if (data.logs) {
    query.$set['logs.channel'] = data.logs.channel;
    if (data.logs.webhook) query.$set['logs.webhook'] = data.logs.webhook;
  }

  if (data.files) {
    query.$set['files.channel'] = data.files.channel;
    if (data.files.webhook) query.$set['files.webhook'] = data.files.webhook;
  }

  if (data.blogs) {
    query.$set['blogs.channel'] = data.blogs.channel;
    if (data.blogs.webhook) query.$set['blogs.webhook'] = data.blogs.webhook;
  }

  return new Promise((resolve, reject) => {
    database.collection('guilds').findOneAndUpdate({id}, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

updateInfractionCount = (guild) => {
  const query = {$inc: {infractions: 1}};

  return new Promise((resolve, reject) => {
    database.collection('guilds').findOneAndUpdate({id: guild.id}, query, (err, result) => {
      if (err) reject(err);
      guild.db.infractions++;
      resolve(result.value.infractions + 1);
    });
  });
};
