// shared/constants/spoons.js
exports.SPOON_MAX = 12;

exports.clampSpoons = function (n) {
  if (n === undefined || n === null || isNaN(n)) return 0;
  const x = Math.round(Number(n));
  return Math.max(0, Math.min(exports.SPOON_MAX, x));
};