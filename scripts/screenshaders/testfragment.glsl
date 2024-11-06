#version 300 es

precision highp float;

uniform vec2 iResolution;

uniform sampler2D iChannel0;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;

    vec3 color = vec3(uv, 1.0);

    fragColor = vec4(color.bgr, 1.0);
}
