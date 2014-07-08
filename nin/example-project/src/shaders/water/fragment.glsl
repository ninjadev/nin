varying vec2 vUv;
uniform sampler2D texture2;
uniform float time2;

void main() {
    vec2 position = -1.0 + 2.0 * vUv;
    vec4 noise = texture2D(texture2, vUv);
    vec2 T = vUv + vec2(-2.5, 10.0) * time2 * 0.01;

    T.x -= noise.y * 0.2;
    T.y += noise.z * 0.2;

    vec4 color = texture2D(texture2, T * 1.5);
    gl_FragColor = color;
}
