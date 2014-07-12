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
  t = clamp(0, t, 1);
  return b*(t)*t*t*t + a;
}

function easeOut(a, b, t) {
  t = clamp(0, t, 1);
  return -b * ((t-=1)*t*t*t - 1) + a;
}
