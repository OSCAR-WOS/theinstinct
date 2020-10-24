const InfractionMini = require('./InfractionMini.js');

module.exports = class Infraction extends InfractionMini {
  constructor(id, guild, user, executor, type, expire) {
    super(id, expire);

    this.id = 0;
    this.guild = guild;
    this.user = user;
    this.executor = executor;

    this.data = {
      type,
      reasons: [],
      name: null,
      executorName: null,
      message: null,
      executed: false,
      timestamp: new Date().valueOf(),
    };
  }

  resolveMini() {
    return new InfractionMini(this._id, this.expire);
  }
};
