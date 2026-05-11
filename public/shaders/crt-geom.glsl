// CRT Geometry Shader - Realistic CRT Monitor Emulation
// Based on cgwg's crt-geom shader with modifications for NeoCab

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

// CRT Parameters
uniform float CRTgamma;      // CRT Gamma (default: 2.2)
uniform float monitorgamma;  // Monitor Gamma (default: 2.2)
uniform float d;             // Distance (default: 1.5)
uniform float R;             // Radius (default: 2.0)
uniform float cornersize;    // Corner size (default: 0.0030)
uniform float cornersmooth;  // Corner smooth (default: 1000.0)

const float pi = 3.1415926535897932384626433832795;
const vec3 dategamma = vec3(1.0 / 2.2);

vec2 corner(vec2 coord)
{
    coord *= tex_size / output_size;
    coord -= vec2(0.5);
    float len = length(coord);

    if (len < R)
    {
        return coord;
    }

    return normalize(coord) * R;
}

vec2 distort(vec2 coord)
{
    coord = corner(coord);
    coord += vec2(0.5);
    coord /= vec2(1.0 + cornersize);
    coord += vec2(0.5 - 0.5 / (1.0 + cornersize));

    return coord * tex_size / output_size;
}

float corner_mod(vec2 coord)
{
    coord *= tex_size / output_size;
    coord -= vec2(0.5);
    float len = length(coord);

    float csize = cornersize;
    float smoothsize = 1.0 / cornersmooth;

    return smoothstep(1.0, 1.0 - csize - smoothsize, len);
}

void main()
{
    vec2 pos = distort(texCoord);

    if (pos.x < 0.0 || pos.x > 1.0 || pos.y < 0.0 || pos.y > 1.0)
    {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    else
    {
        vec3 color = texture2D(tex, pos).rgb;

        // Apply gamma correction
        color = pow(color, vec3(1.0 / CRTgamma));

        // Apply monitor gamma
        color = pow(color, dategamma * (monitorgamma / 2.2));

        // Apply corner fade
        color *= corner_mod(texCoord);

        gl_FragColor = vec4(color, 1.0);
    }
}

#endif
