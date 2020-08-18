module.exports.logLengthCheck = function(string) {
  if (string.length < 500 && string.split('\n').length < 5) return true;
  return false;
}