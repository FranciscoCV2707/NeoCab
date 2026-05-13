// Phosphor Shader - Shadow mask / dot matrix effect

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

// Phosphor Parameters
uniform float phosphor_strength; // Strength (0.0-1.0, default: 0.5)

// Shadow mask pattern for RGB
const vec3 mask_rgb = vec3(1.0, 0.7, 1.0);

void main()
{
    vec2 pos = texCoord * tex_size;
    vec3 color = texture2D(tex, texCoord).rgb;

    // Calculate mask position based on pixel position
    float mask_x = mod(pos.x, 3.0);

    // Determine which channel to attenuate based on X position
    vec3 mask = vec3(1.0);

    if (mask_x < 1.0) {
        mask = vec3(1.0, 0.7, 0.7);  // Red emphasis
    } else if (mask_x < 2.0) {
        mask = vec3(0.7, 1.0, 0.7);  // Green emphasis
    } else {
        mask = vec3(0.7, 0.7, 1.0);  // Blue emphasis
    }

    // Add scanlines for more authentic look
    float scanline = sin(pos.y * 3.14159265);
    scanline = abs(scanline);

    // Combine mask and scanline
    float strength = phosphor_strength;
    mask = mix(vec3(1.0), mask, strength);
    mask *= (1.0 - (scanline * strength * 0.3));

    // Apply mask to color
    color *= mask;

    gl_FragColor = vec4(color, 1.0);
}

#endif
