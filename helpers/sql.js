const MongoClient = require('mongodb').MongoClient;
let db;

const modules = ['message_delete', 'message_update', 'message_bulk_delete', 'join', 'leave', 'kick', 'ban', 'unban', 'role_add', 'role_remove', 'mute_add', 'punish_add', 'gag_add', 'mute_remove', 'punish_remove', 'gag_remove', 'username_update', 'nickname_update'];

module.exports.connect = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = new MongoClient(process.env.database, {useNewUrlParser: true, useUnifiedTopology: true});
      const connection = await client.connect();
      resolve(db = connection.db('instinct'));
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

      if (!guild) await db.collection('guilds').insertOne(values);
      else values = guild;

      resolve(values);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.insertAttachment = (channel, id, url) => {
  return new Promise((resolve, reject) => {
    db.collection('attachments').insertOne({channel, id, url}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports.findAttachment = (channel, id) => {
  return new Promise((resolve, reject) => {
    db.collection('attachments').findOne({channel, id}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports.keepAttachment = (id) => {
  const query = {$set: {keep: true}};

  return new Promise((resolve, reject) => {
    db.collection('attachments').findOneAndUpdate({_id: id}, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports.purgeAttachments = () => {
  db.collection('attachments').deleteMany({keep: {$exists: false}}, (err, result) => {
    db.collection('attachments').updateMany({}, {$unset: {keep: ''}}, (err, results) => {});
  });
};

findGuild = (id) => {
  return new Promise((resolve, reject) => {
    db.collection('guilds').findOne({id}, (err, result) => {
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
    db.collection('guilds').findOneAndUpdate({id}, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};
