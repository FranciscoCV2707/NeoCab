# Custom Shaders

Place custom `.glsl` fragment shaders in this directory. NeoCab v1.3.0 lists them as `Custom - <filename>` and validates that each shader defines `void main` and writes a fragment color with `gl_FragColor` or `fragColor`.

Invalid shaders remain visible in the selector with an error state and cannot be applied.
