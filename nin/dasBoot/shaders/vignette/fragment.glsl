uniform sampler2D tDiffuse;
uniform float amount;
varying vec2 vUv;

void main() {
    vec4 original = texture2D(tDiffuse, vUv);
    float dist = length(vUv - vec2(0.5, 0.5));
    dist = clamp(0., 1., dist / 0.707);
    dist = pow(dist, 3.);
    gl_FragColor = vec4(original.xyz * (1. - dist * amount), 1.);
}
