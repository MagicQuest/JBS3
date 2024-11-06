#version 300 es

precision highp float;

in vec2 vertPosition;

out vec4 fragColor;

void main() {
    gl_Position = vec4(vertPosition, 0.0, 1.0);
}