const constants = require('./constants.js');

const MongoClient = require('mongodb').MongoClient;
let db;

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

module.exports.loadGuild = (id) => {
  let values = {
    id,
    prefix: process.env.prefix,
    language: process.env.language,
    managers: [process.env.owner],
    logs: {channel: null, webhook: {id: null, token: null}, detailed: {}, setting: constants.LogSetting.SIMPLE, enabled: true},
    files: {channel: null, webhook: {id: null, token: null}, enabled: false},
    blogs: {channel: null, webhook: {id: null, token: null}, enabled: false},
    roles: {mute: null, punish: null, gag: null},
    cases: null,
    infractions: 0,
  };

  Object.values(constants.Log).forEach((type) => values.logs.detailed[type] = {channel: null, webhook: {id: null, token: null}, enabled: true});

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

exports.insertAttachment = (channel, id, url) => {
  return new Promise((resolve, reject) => {
    db.collection('attachments').insertOne({channel, id, url}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

exports.keepAttachment = (channel, id) => {
  const query = {$set: {keep: true}};

  return new Promise((resolve, reject) => {
    db.collection('attachments').findOneAndUpdate({channel, id}, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

exports.purgeAttachments = (channel) => {
  return new Promise((resolve, reject) => {
    db.collection('attachments').deleteMany({channel, keep: {$exists: false}}, (err, result) => {
      if (err) reject(err);

      db.collection('attachments').updateMany({channel}, {$unset: {keep: ''}}, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  });
};

exports.insertLog = (guild, message, data) => {
  const {member, executor} = data;

  const values = {
    guild: guild.id,
    timestamp: Date.now(),
    data: {},
  };

  if (message) values.message = message.url;

  if (member) {
    values.data.member = {id: member.id, username: member.user.username, discriminator: member.user.discriminator};
    if (member.displayName !== member.user.username) values.data.member.nickname = member.displayName;
  }

  if (executor) {
    values.data.executor = {id: executor.id, username: executor.user.username, discriminator: executor.user.discriminator};
    if (executor.displayName !== executor.user.username) values.data.executor = executor.displayName;
  }

  return new Promise(async (resolve, reject) => {
    db.collection('logs').insertOne(values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

module.exports.insertUsername = (user) => {
  return new Promise(async (resolve, reject) => {

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
