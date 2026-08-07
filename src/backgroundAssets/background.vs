#version 300 es

in vec4 a_pos;
out vec4 pos;

void main()
{
    pos = a_pos;
    gl_Position = a_pos;
    
}