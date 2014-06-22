uniform float amount;
uniform float r;
uniform float g;
uniform float b;
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
    vec4 fragColor = texture2D(tDiffuse, vUv);
    gl_FragColor = vec4(mix(fragColor.r, fragColor.r * r, amount),
                        mix(fragColor.g, fragColor.g * g, amount),
                        mix(fragColor.b, fragColor.b * b, amount),
                        1.);
}
