let gl, program; //OH YEAH BABY GL IS COMING THROUGH
let canvas;
let uniformLocations = {};
let time, lastFrame;
let texture;
//let buffer = true;

const VS = `#version 300 es
    precision highp float;

    in vec2 vertPosition;

    out vec4 fragColor;

    void main() {
        gl_Position = vec4(vertPosition, 0.0, 1.0);
    }
`;

const FS = `#version 300 es
    precision highp float;

    uniform vec2 iResolution;

    uniform sampler2D iChannel0;

    uniform float fTime;
    uniform vec2 vMouse;

    out vec4 fragColor;

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        
        float color = texture(iChannel0, uv).x;
        float sum = 0.0;

        for(int i = -1; i <= 1; i++) {
            for(int j = -1; j <= 1; j++) {
                vec2 offset = vec2(i, j) / iResolution.xy;		 // Scale the offset down
                float lookup = texture(iChannel0, uv + offset).x;  // Apply offset and sample
                sum += round(lookup); //* 1.06382979 //+.06;
            }
        }

        sum -= color; //because if this pixel is white the sum will include this pixel
        //if(color > 0.0) {
        //    if(sum != 2.0 && sum != 3.0) {
        //        color = 0.0;
        //    }
        //}else {
        //    if(sum == 3.0) {
        //        color = 1.0;
        //    }
        //}
        if(color > 0.0) {
            if(sum < 2.0 || sum > 3.0) {
                color = 0.0;
            }else {
                color = 1.0;
            }
        }else {
            if(sum == 3.0) {
                color = 1.0;
            }else {
                color = 0.0;
            }
        }

        if(distance(vMouse.xy, uv) < .05) {
            color = 1-color;
        }

        fragColor = vec4(color, color, 0.0, 1.0);
    }
`;

//const FS = `#version 300 es  //fire CCA
//precision mediump float;
//
//uniform vec2 iResolution;
//
//uniform sampler2D iChannel0;
//
//out vec4 fragColor;
//
//float activation(float x) {
//    //return abs(1.2*x); //waves
//    return abs(x/1.5);
//}
//
//void main() {
//    vec2 uv = gl_FragCoord.xy / iResolution.xy;
//    
//    //const mat3 f = mat3(0.565, -0.716, 0.565, -0.716, 0.627, -0.716, 0.565, -0.716, 0.565); //waves
//    const mat3 f = mat3(.808, -.875, .274, .927, -.816, .272, -.987, .867, .37); //fire
//
//    //const vec3 f1 = vec3(0.565, -0.716, 0.565);
//    //const vec3 f2 = vec3(-0.716, 0.627, -0.716);
//    //const vec3 f3 = vec3(0.565, -0.716, 0.565);
//
//    float color;// = texture(iChannel0, uv).x;
//
//    float sum = 0.0;
//
//    for(int i = -1; i <= 1; i += 1)
//    {
//        for( int j = -1; j <= 1; j += 1)
//        {
//            vec2 offset = vec2(i, j) / iResolution.xy;		 // Scale the offset down
//            vec4 lookup = texture(iChannel0, uv + offset);   // Apply offset and sample
//            //if(lookup.x == 1.0) {
//                sum += lookup.y*f[2-(i+1)][2-(j+1)];
//            //}
//        }
//    }
//
//    sum = clamp(sum, -1., 1.);
//    //sum -= color; //oops you gotta subtract this tiles color from itself (or just not include it if i and j are 0)
////
//    //if(color > 0.0) {
//    //    if(sum < 2.0 || sum > 3.0) {
//    //        color = 0.0;
//    //    }else {
//    //        color = 1.0;
//    //    }
//    //}else {
//    //    if(sum == 3.0) {
//    //        color = 1.0;
//    //    }else {
//    //        color = 0.0;
//    //    }
//    //}
//
//    fragColor = vec4(vec3(0.0, 1.0*activation(sum), 0.5*activation(sum)), 1.0);
//}
//`;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //SetLayeredWindowAttributes(hwnd, RGB(0,0,0), 0, LWA_COLORKEY);
        //somehow i gotta use wic to load textures
        gl = createCanvas("gl", NULL, hwnd); //for opengl the second param is null
        //gl init here
        canvas = GetClientRect(hwnd);
        gl.viewport(0,0,canvas.right,canvas.bottom);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        print(gl.VERTEX_SHADER, "VERTEX_SHADER");
        print(gl.FRAGMENT_SHADER, "FRAGMENT_SHADER");
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
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

        gl.detachShader(program, vertexShader);
        gl.detachShader(program, fragmentShader);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const linkErrLog = gl.getProgramInfoLog(program);
            print(`Shader program did not link successfully. Error log: ${linkErrLog}`);
            //cleanup();
            //document.querySelector(
            //"p"
            //).textContent = `Shader program did not link successfully. Error log: ${linkErrLog}`;
            return;
        }

        const rect = [
            -1,1,
            -1,-1,
            1,-1,
            1,1,
        ];

        let rectVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rectVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rect), gl.STATIC_DRAW);

        let pAL = gl.getAttribLocation(program, 'vertPosition'); 
        gl.vertexAttribPointer(pAL, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(pAL);

        gl.useProgram(program);

        function registerUniform(type, name, value) {
            uniformLocations[name] = gl.getUniformLocation(program, name);
            gl[`uniform${type}`](uniformLocations[name], value);
        }

        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //ok idk if this gone work but

        function isPowerOf2(value) {
            return (value & (value - 1)) === 0;
        }

        const iChannel0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, iChannel0);

        //load image??
        //NOWS THE TIME FOR WIC TO SHINE!
        let t = Date.now();
        const wic = InitializeWIC(); ScopeGUIDs(wic);
        const wicBitmap = wic.LoadBitmapFromFilename(__dirname+"/troll.bmp", wic.GUID_WICPixelFormat32bppPRGBA, 0); //uh oh how tf am i gonna make these values from 0-1
        print(gl.TEXTURE_2D, gl.RGBA, gl.UNSIGNED_BYTE, gl.BGRA);
        wicBitmap.Resize(wic, canvas.right, canvas.bottom, WICBitmapInterpolationModeHighQualityCubic);
        //const {width, height} = wicBitmap.GetSize();
        texture = wicBitmap.GetSize();
        print(texture.width, texture.height, "100%");
        const bits = wicBitmap.GetPixels(wic, WICBitmapTransformFlipVertical); //sudden second argument
        //print(bits);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texture.width, texture.height, NULL, gl.RGBA, gl.UNSIGNED_BYTE, bits); //weird i thought it would be gl.UNSIGNED_INT
        if(isPowerOf2(texture.width) && isPowerOf2(texture.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //TWAS linear
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        wicBitmap.Release();
        wic.Release();
        print((Date.now()-t)/1000, "I WAS RECORDING THE ENTIRE DAY");
        registerUniform("2fv", "iResolution", new Float32Array([canvas.right, canvas.bottom]));
        registerUniform("1f", "fTime", 0.0);
        registerUniform("1i", "iChannel0", 0);
        registerUniform("2fv", "vMouse", new Float32Array([-1, -1]));

        //print(gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)); //4 verts
    
        print(gl.COLOR_BUFFER_BIT);
        print(gl.COMPILE_STATUS);
        print(gl.GetString(gl.RENDERER));
        print(gl.GetString(gl.VERSION));
        time = Date.now();
        SetTimer(hwnd, 0, 8);
    }else if(msg == WM_RBUTTONDOWN) {
        //gl.viewport(0, 0, canvas.right, canvas.bottom);
        //gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); //4 verts
        //print(gl.readPixels(0, 0, canvas.right, canvas.bottom, gl.RGBA, gl.UNSIGNED_BYTE));
        const pixels = gl.readPixels(0, 0, canvas.right, canvas.bottom, gl.RGBA, gl.UNSIGNED_BYTE);
        
        const dc = GetDC(NULL);                                                             //use negative height here to flip image with StretchDIBits (idk why the color is messed up )
        StretchDIBits(dc, 0, 0, canvas.right, canvas.bottom, 0, 0, canvas.right, canvas.bottom, pixels, canvas.right, -canvas.bottom, 32, BI_RGB, SRCCOPY); //long ahh function
        ReleaseDC(NULL, dc);
    }else if(msg == WM_LBUTTONDOWN || msg == WM_MOUSEMOVE) {
        if((wp & MK_LBUTTON) == MK_LBUTTON) {
            let mouse = MAKEPOINTS(lp);
            gl.uniform2fv(uniformLocations["vMouse"], new Float32Array([mouse.x/canvas.right, 1-(mouse.y/canvas.bottom)])); //coordinates are from 0-1 and starts at bottom left corner (for some reason)
        }
    }else if(msg == WM_LBUTTONUP) {
        gl.uniform2fv(uniformLocations["vMouse"], new Float32Array([-1,-1]));
    }
    else if(msg == WM_TIMER) {// || msg == WM_LBUTTONDOWN) {
        //print(1000/(Date.now()-lastFrame));
        SetWindowText(hwnd, `conway's game of life BUT OPENGL (fps: ${Math.round(1000/(Date.now()-lastFrame))})`)
        lastFrame = Date.now();
        gl.viewport(0, 0, canvas.right, canvas.bottom);
        gl.uniform1f(uniformLocations["fTime"], (Date.now()-time)/1000.0);
        //let t = Date.now();
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4, true); //4 verts
        //buffer = !buffer;
        //print((Date.now()-t)/1000, "draw");
        //t = Date.now();
        //gl.readBuffer(!buffer ? gl.FRONT : gl.BACK);
        //gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, texture.width, texture.height, NULL);//canvas.right, canvas.bottom, NULL);
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, texture.width, texture.height);
        //print((Date.now()-t)/1000, "copy");
        //t = Date.now();
        /*print(*/gl.swapBuffers();//==1); //unfortunately for some reason you need to swapBuffers after
        //print((Date.now()-t)/1000, "manual swap");
    }else if(msg == WM_SIZE || msg == WM_SIZING) {
        canvas = GetClientRect(hwnd);
        //const size = MAKEPOINTS(lp);
        gl.uniform2fv(uniformLocations["iResolution"], new Float32Array([canvas.right, canvas.bottom]));
        //if(msg == WM_SIZE) {
        //    SetWindowPos(hwnd, NULL, 0, 0, size.x, size.x, SWP_NOMOVE | SWP_NOZORDER);
        //}
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

window = CreateWindow(/*WS_EX_LAYERED*/WS_EX_OVERLAPPEDWINDOW, wc, "conway's game of life BUT OPENGL", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 800+20, 800+42, NULL, NULL, hInstance);