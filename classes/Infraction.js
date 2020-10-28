const InfractionMini = require('./InfractionMini.js');

module.exports = class Infraction extends InfractionMini {
  constructor(id, guild, member, executor, type, time, expire = null) {
    const timestamp = new Date().valueOf();
    super(id, expire ? expire : time ? timestamp + time : null);

    this.id = 0;
    this.guild = guild;
    this.member = member;
    this.executor = executor;

    this.data = {
      type,
      reasons: [],
      name: null,
      executorName: null,
      message: null,
      timestamp,
      time,
    };
  }

  resolve() {
    return new InfractionMini(this._id, this.expire);
  }
};
