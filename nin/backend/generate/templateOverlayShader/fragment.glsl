uniform float frame;
uniform sampler2D overlay;
uniform sampler2D background;

varying vec2 vUv;

void main() {
  vec4 overlay = texture2D(overlay, vUv);
  vec4 background = texture2D(background, vUv);

  if (overlay == vec4(0.)) {
      gl_FragColor = background;
  } else {
      gl_FragColor = overlay;
  }
}
