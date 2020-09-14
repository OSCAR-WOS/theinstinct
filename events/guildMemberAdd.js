const functions = require('../functions/functions.js');
const log = require('../functions/log.js');
const sql = require('../functions/sql.js');

module.exports = async (client, member) => {
  if (member.banned) delete member.banned;

  var infractions = 0;
  try { 
    let query = await sql.findInfractions({ guild: member.guild.id, member: member.id });
    infractions = query.length;

    query = query.filter(infraction => !infraction.data.executed);
    query.forEach(infraction => functions.addTimedRole(member.guild, member, infraction.data.type));
  } catch { }

  try { await log.send(member.guild, { member, infractions } , log.Type.JOIN);
  } catch { }
}