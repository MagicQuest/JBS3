//oh wait i mifght be able to do this with a framebuffer or something... https://www.opengl-tutorial.org/intermediate-tutorials/tutorial-14-render-to-texture/

const fs = require("fs");

const vertex_shader = fs.read(__dirname+"/testvertex.glsl");

const fragment_shader = fs.read(__dirname+"/testfragment.glsl");

let program, iChannel0;

const w = 512;
const h = 512;

function createProgram(vertexShader, fragmentShader, i) {
    const p = gl.createProgram();

    gl.attachShader(p, vertexShader);
    gl.attachShader(p, fragmentShader);

    gl.linkProgram(p);

    gl.detachShader(p, vertexShader);
    gl.detachShader(p, fragmentShader);

    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const linkErrLog = gl.getProgramInfoLog(p);
        cleanup();
        print(`Shader program #${i} did not link successfully. Error log: ${linkErrLog}`);
        //document.querySelector(
        //"p"
        //).textContent = `Shader program #${i} did not link successfully. Error log: ${linkErrLog}`;
        return;
    }

    return p;
}

function loadshaderstring(string, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, string);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        print(`ERROR compiling ${type == gl.VERTEX_SHADER ? "vertex" : type == gl.FRAGMENT_SHADER ? "fragment" : "<unknown type>"} shader!`, gl.getShaderInfoLog(shader));
        return;
    }
    return shader;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        gl = createCanvas("gl", NULL, hwnd);
        
        gl.viewport(0,0,w,h);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const verts = loadshaderstring(vertex_shader, gl.VERTEX_SHADER);
        const frags = loadshaderstring(fragment_shader, gl.FRAGMENT_SHADER);

        program = createProgram(verts, frags, 0);

        gl.deleteShader(verts);
        gl.deleteShader(frags);

        const rect = [
            -1,1,
            -1,-1,
            1,-1,
            1,1,
        ];

        const rectVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rectVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rect), gl.STATIC_DRAW);
        
        gl.useProgram(program);

        const pAL = gl.getAttribLocation(program, 'vertPosition'); 
        gl.vertexAttribPointer(pAL, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(pAL);

        const res = gl.getUniformLocation(program, "iResolution");
        gl.uniform2fv(res, new Float32Array([w, h]));

        iChannel0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0); //oh my questions have finally been answered, and i was just about to ask chat too! (you call activeTexture first and bindTexture assigns iChannel0 to gl.TEXTURE0) https://webglfundamentals.org/webgl/lessons/webgl-2-textures.html
        gl.bindTexture(gl.TEXTURE_2D, iChannel0);

        const dc = GetDC(hwnd);
        const black = CreateDIBSection(dc, CreateDIBitmapSimple(w, h, 32, 1, 0), DIB_RGB_COLORS);
        ReleaseDC(hwnd, dc);
        //await newTexture();
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //lol you were supposed to do this BEFORE using texImage2D
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, NULL, gl.RGBA, gl.UNSIGNED_BYTE, black.GetBits()); //weird i thought it would be gl.UNSIGNED_INT (wait the rgb values are 0-255 so yeah idk why i thought it was unsigned int (probably because im using DWORD* behind the scenes for DIBSection shits))
        DeleteObject(black);

        function isPowerOf2(value) {
            return (value & (value - 1)) === 0;
        }

        if(isPowerOf2(w) && isPowerOf2(h)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //TWAS linear
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        gl.uniform1i(gl.getUniformLocation(program, "iChannel0"), 0);

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        print("fortnite");
        gl.viewport(0, 0, w, h);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4, true);

        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, w, h, 0);

        const dc = GetDC(hwnd);
        const pixels = gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE);
        StretchDIBits(dc, 0, 0, w, h, 0, 0, w, h, pixels, w, -h, 32, BI_RGB, SRCCOPY);
        ReleaseDC(hwnd, dc);
        //gl.swapBuffers();
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "shadereditor like renderdoc", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);
