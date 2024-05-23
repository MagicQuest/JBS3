let gl, program; //OH YEAH BABY GL IS COMING THROUGH

//vertex shader and fragment shader taken from https://www.thecodingnotebook.com/2021/01/understanding-opengl-triangle.html (because idk how to do the triangle thing i only use webgl to draw on the whole screen)
const VS = `#version 300 es
    // Below are 2 input attributes
    // The values for these attributes will be provided
    // by us in the javascript "world"

    // vec2 is a vector with 2 values representing the
    // vertex coordinates (x/y).
    in vec2 a_position;

    // vec3 is a vector with 3 values representing the
    // vertex color (r/g/b).
    in vec3 a_color;

    // output color for this vertex,
    // OpenGL will interpolate these values automatically
    out vec3 color;

    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        color = a_color;
    }
`;

const FS = `#version 300 es
    precision highp float;

    // input color for this fragment, provided by OpenGL by
    // interpolating the output color variable that is in the
    // vertex shader.
    in vec3 color;

    // We should set this output param with the desired
    // fragment color
    out vec4 outColor;

    void main() {
        // just output the color we got, note we got vec3 (rgb)
        // and outColor is vec4, so we use 1.0 for the alpha.
        outColor = vec4(color, 1.0);
    }
`

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //somehow i gotta use wic to load textures
        gl = createCanvas("gl", NULL, hwnd); //for opengl the second param is null
        //gl init here
        const rect = GetClientRect(hwnd);
        gl.viewport(0,0,rect.right,rect.bottom);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const vertexShader = gl.createShader(gl.VERTEX_SHADER); //im using a hello world example from https://github.com/sessamekesh/IndigoCS-webgl-tutorials/blob/master/01%20-%20Simple%20Triangle/app.js
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, VS);
        gl.shaderSource(fragmentShader, FS);

        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            print('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
            return;
        }
        
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            print('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
            return;
        }
    
        program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            print('ERROR linking program!', gl.getProgramInfoLog(program));
            return;
        }
        gl.validateProgram(program); //haha hold on i didn't implement validateProgram!
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            print('ERROR validating program!', gl.getProgramInfoLog(program));
            return;
        }
    
        //
        // Create buffer
        //
        const triangleVertices = 
        [ // X, Y,       R, G, B
            0.0, 0.5,    1.0, 0.0, 0.0,//1.0, 1.0, 0.0,
            -0.5, -0.5,  0.0, 1.0, 0.0,//0.7, 0.0, 1.0,
            0.5, -0.5,   0.0, 0.0, 1.0 //0.1, 1.0, 0.6
        ];
    
        const triangleVertexBufferObject = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    
        const positionAttribLocation = gl.getAttribLocation(program, 'a_position');
        const colorAttribLocation = gl.getAttribLocation(program, 'a_color');
        gl.vertexAttribPointer(
            positionAttribLocation, // Attribute location
            2, // Number of elements per attribute
            gl.FLOAT, // Type of elements
            gl.FALSE, //gl.FALSE is crazy because it isn't even in the webgl specs (its value is undefined)
            5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            0 // Offset from the beginning of a single vertex to this attribute
        );
        gl.vertexAttribPointer(
            colorAttribLocation, // Attribute location
            3, // Number of elements per attribute
            gl.FLOAT, // Type of elements
            gl.FALSE,
            5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            2 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
        );
    
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.enableVertexAttribArray(colorAttribLocation);
    
        //
        // Main render loop
        //
        gl.useProgram(program);
        gl.drawArrays(gl.TRIANGLES, 0, 3);    
        
        print(gl.COLOR_BUFFER_BIT);
        print(gl.COMPILE_STATUS);
        print(gl.GetString(gl.RENDERER));
        print(gl.GetString(gl.VERSION));
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        const rect = GetClientRect(hwnd);
        gl.viewport(0,0,rect.right,rect.bottom);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    else if(msg == WM_DESTROY) {
        //bitmap.Release();
        PostQuitMessage(0);
        gl.deleteProgram(program);
        gl.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "newopenglfuncs.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+16, 512+39, NULL, NULL, hInstance);