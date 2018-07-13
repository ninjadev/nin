uniform float frame;
uniform sampler2D overlay;
uniform sampler2D background;

varying vec2 vUv;

void main() {
  vec4 overlay = texture2D(overlay, vUv);
  vec4 background = texture2D(background, vUv);
  
  gl_FragColor = mix(background, vec4(overlay.rgb, 1.0), overlay.a);
}
