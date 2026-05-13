// Scanlines Shader - Horizontal scanlines effect for CRT emulation

#ifdef GL_ES
precision highp float;
#endif

varying vec2 texCoord;

#if defined(VERTEX)

void main()
{
    gl_Position = projection * (modelview * vertexPosition);
    texCoord = vertexTexCoord;
}

#elif defined(FRAGMENT)

uniform sampler2D tex;
uniform vec2 tex_size;
uniform vec2 output_size;

// Scanline Parameters
uniform float scanline_strength;   // Strength (0.0-1.0, default: 0.75)
uniform float scanline_thickness;  // Thickness (0.5-2.0, default: 1.0)

void main()
{
    vec3 color = texture2D(tex, texCoord).rgb;

    // Calculate scanline position
    float scanline = sin(texCoord.y * tex_size.y * 3.14159265 * 2.0);

    // Apply thickness
    scanline = abs(scanline);
    scanline = pow(scanline, scanline_thickness);

    // Apply strength
    float darkness = 1.0 - (scanline * scanline_strength);

    // Apply to color
    color *= darkness;

    gl_FragColor = vec4(color, 1.0);
}

#endif
