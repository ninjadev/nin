uniform sampler2D tDiffuse;
uniform float amount;
varying vec2 vUv;

void main() {
    vec4 original = texture2D(tDiffuse, vUv);
    float dist = length(vUv - vec2(0.5, 0.5));
    dist = dist / 0.707;
    if(dist < 0.) dist = 0.;
    if(dist > 1.) dist = 1.;
    dist = dist * dist * dist;
    gl_FragColor = vec4(original.xyz * (1. - dist * amount), 1.);
}
