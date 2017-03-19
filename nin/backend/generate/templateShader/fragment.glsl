uniform float frame;
uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {
    gl_FragColor = vec4(vUv, 0.5 + 0.5 * sin(frame / 60.0), 1.0);
}
