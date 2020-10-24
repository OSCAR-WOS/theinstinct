// const functions = require('../functions/functions.js');
const log = require('../helpers/log.js');
const sql = require('../helpers/sql.js');

module.exports = async (client, member) => {
  if (member.banned) delete member.banned;
  let infractions = 0;

  try {
    const query = await sql.findInfractions({guild: member.guild.id, member: member.id});
    infractions = query.length;

    query = query.filter((infraction) => !infraction.data.executed);
    // query.forEach(infraction => functions.addTimedRole(member.guild, member, infraction.data.type));
  } catch { }

  try {
    await log.send(member.guild, log.Type.JOIN, {member, infractions});
  } catch { }
};
