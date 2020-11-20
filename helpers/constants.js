exports.Resolve = {
  ALL: 'all',
  GUILD: 'guild',
};

exports.LogSetting = {
  SIMPLE: 'simple',
  DETAILED: 'detailed',
};

exports.AttachmentError = {
  SIZE: 'log_attachment_size',
  UNSUPPORTED: 'log_attachment_unsupported',
  ABUSE: 'log_attachment_abuse',
};

exports.Log = {
  MESSAGE_DELETE: 'message_delete',
  MESSAGE_UPDATE: 'message_update',
  MESSAGE_BULK_DELETE: 'message_bulk_delete',
  JOIN: 'join',
  LEAVE: 'leave',
  KICK: 'kick',
  BAN: 'ban',
  UNBAN: 'unban',
  ROLE_ADD: 'role_add',
  ROLE_REMOVE: 'role_remove',
  MUTE_ADD: 'mute_add',
  PUNISH_ADD: 'punish_add',
  GAG_ADD: 'gag_add',
  MUTE_REMOVE: 'mute_remove',
  PUNISH_REMOVE: 'punish_remove',
  GAG_REMOVE: 'gag_remove',
  USERNAME_UPDATE: 'username_update',
  NICKNAME_UPDATE: 'nickname_update',
};

exports.Message = {
  NORMAL: 'type_normal',
  CODE: 'type_code',
  SUCCESS: 'type_success',
  ERROR: 'type_error',
  EMBED: 'type_embed',
  USAGE: 'type_usage',
};

exports.Webhook = {
  FILES: 'Files',
  LOGS: 'Logs',
  BLOGS: 'Bot Logs',
};

exports.AttachmentType = {
  MESSAGE: 'message',
  OLD_MESSAGE: 'old_message',
  NEW_MESSAGE: 'new_message',
  MESSAGES: 'messages',
};
