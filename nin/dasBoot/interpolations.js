function lerp(a, b, t) {
  t = clamp(0, t, 1);
  return b * t + a * (1 - t);
} 

function clamp(a, v, b) {
  return Math.min(b, Math.max(v, a));
}

function smoothstep(a, b, t) {
  t = clamp(0, t, 1);
  var v = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  return b * v + a * (1 - v);
}

function easeIn(a, b, t) {
  return lerp(a, b, t*t*t);
}

function easeOut(a, b, t) {
  t = (--t)*t*t+1;
  return lerp(a, b, t);
}

function elasticOut(b, c, d, t) {
  t = clamp(0, t, 1);
  const ts = (t /= d) * t;
  const tc = ts * t;
  return b+c*(33*tc*ts + -106*ts*ts + 126*tc + -67*ts + 15*t);
}

module.exports = {
  lerp,
  clamp,
  smoothstep,
  easeIn,
  easeOut,
  elasticOut,
};
