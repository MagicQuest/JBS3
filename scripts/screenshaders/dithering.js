//crazy dithering fragment shader stolen from https://github.com/GarrettGunnell/Post-Processing/tree/main/Assets/Pixel%20Art
//https://github.com/GarrettGunnell/Post-Processing/blob/main/Assets/Pixel%20Art/Dither.shader
//https://github.com/GarrettGunnell/Post-Processing/blob/main/Assets/Pixel%20Art/Ditherer.cs
//https://www.youtube.com/watch?v=8wOUe32Pt-E

let gl, program;
let uniformLocations = {};
let iChannel1; //screen texture
let screenBmp;
let impact;
let selected = 0;

var _Spread = 0.5; //press left and right arrow to select which variable to change with the up or down arrows
var _RedColorCount = 2;
var _GreenColorCount = 2;
var _BlueColorCount = 2;
var _BayerLevel = 0;

//shoot in 99% of all my webgl projects this is all the vertex shader you gone get
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

    uniform sampler2D iChannel1;

    uniform vec3 vMouse;

    uniform float fTime;

    out vec4 fragColor;

    uniform float _Spread;// = 0.5f;
    uniform int _RedColorCount;// = 2;
    uniform int _GreenColorCount;// = 2;
    uniform int _BlueColorCount;// = 2;
    uniform int _BayerLevel;// = 0;

    const int bayer2[2 * 2] = int[](
        0, 2,
        3, 1
    );

    const int bayer4[4 * 4] = int[](
        0, 8, 2, 10,
        12, 4, 14, 6,
        3, 11, 1, 9,
        15, 7, 13, 5
    );

    const int bayer8[8 * 8] = int[](
        0, 32, 8, 40, 2, 34, 10, 42,
        48, 16, 56, 24, 50, 18, 58, 26,  
        12, 44,  4, 36, 14, 46,  6, 38, 
        60, 28, 52, 20, 62, 30, 54, 22,  
        3, 35, 11, 43,  1, 33,  9, 41,  
        51, 19, 59, 27, 49, 17, 57, 25, 
        15, 47,  7, 39, 13, 45,  5, 37, 
        63, 31, 55, 23, 61, 29, 53, 21
    );

    float GetBayer2(int x, int y) {
        return float(bayer2[(x % 2) + (y % 2) * 2]) * (1.0f / 4.0f) - 0.5f;
    }

    float GetBayer4(int x, int y) {
        return float(bayer4[(x % 4) + (y % 4) * 4]) * (1.0f / 16.0f) - 0.5f;
    }

    float GetBayer8(int x, int y) {
        return float(bayer8[(x % 8) + (y % 8) * 8]) * (1.0f / 64.0f) - 0.5f;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        vec4 col = texture(iChannel1, uv); //_MainTex.Sample(point_clamp_sampler, i.uv);

        //int x = i.uv.x * _MainTex_TexelSize.z;
        //int y = i.uv.y * _MainTex_TexelSize.w;

        int x = int(gl_FragCoord.x);
        int y = int(gl_FragCoord.y);

        vec3 bayerValues = vec3(0.0);
        bayerValues[0] = GetBayer2(x, y);
        bayerValues[1] = GetBayer4(x, y);
        bayerValues[2] = GetBayer8(x, y);

        vec4 outputbutnotreserved = col + _Spread * bayerValues[_BayerLevel]; //output is a reserved keyword

        outputbutnotreserved.r = floor((_BlueColorCount - 1.0f) * outputbutnotreserved.r + 0.5) / (_BlueColorCount - 1.0f);
        outputbutnotreserved.g = floor((_GreenColorCount - 1.0f) * outputbutnotreserved.g + 0.5) / (_GreenColorCount - 1.0f);
        outputbutnotreserved.b = floor((_RedColorCount - 1.0f) * outputbutnotreserved.b + 0.5) / (_RedColorCount - 1.0f);

        fragColor = outputbutnotreserved.bgra;

        //fragColor = vec4(, 1.0, 1.0);
    }
`;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, NULL, 255, LWA_ALPHA);
        SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE); //it's gonna work steve....
        impact = CreateFontSimple("impact", 16, 32);

        gl = createCanvas("gl", NULL, hwnd); //for opengl the second param is null
        //gl init here
        gl.viewport(0,0,screenWidth,screenHeight);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

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

        const dc = GetDC(NULL);
        screenBmp = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, screenHeight, 32, 1, 0), DIB_RGB_COLORS);
        print(screenWidth, screenHeight, "100%");
        ReleaseDC(NULL, dc);

        iChannel1 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, iChannel1);

        if(isPowerOf2(screenWidth) && isPowerOf2(screenHeight)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //TWAS linear
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, NULL, gl.RGBA, gl.UNSIGNED_BYTE, NULL); //weird i thought it would be gl.UNSIGNED_INT

        registerUniform("2fv", "iResolution", new Float32Array([screenWidth, screenHeight]));
        registerUniform("1i", "iChannel1", 1);
        registerUniform("3fv", "vMouse", new Float32Array([-1, -1, 0]));
        registerUniform("1f", "fTime", 0.0);
        registerUniform("1f", "_Spread", _Spread);
        registerUniform("1i", "_RedColorCount", _RedColorCount);
        registerUniform("1i", "_GreenColorCount", _GreenColorCount);
        registerUniform("1i", "_BlueColorCount", _BlueColorCount);
        registerUniform("1i", "_BayerLevel", _BayerLevel);

        print(_Spread, globalThis[_Spread]);

        //print(gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)); //4 verts
    
        print(gl.COLOR_BUFFER_BIT);
        print(gl.COMPILE_STATUS);
        print(gl.GetString(gl.RENDERER));
        print(gl.GetString(gl.VERSION));
        time = Date.now();

        //RedrawWindow(hwnd, 0, 0, windowcx, windowcy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_LBUTTONDOWN || msg == WM_TIMER) {
        if(GetKey(VK_ESCAPE)) {
            DestroyWindow(hwnd);
            return;
        }
        //if(GetKey(VK_LBUTTON)) {
            const mouse = GetCursorPos();
            gl.uniform3fv(uniformLocations["vMouse"], new Float32Array([mouse.x/screenWidth, 1-(mouse.y/screenHeight), GetKey(VK_LBUTTON) > 0])); //using z to tell if mouse is down (GetKey returns some positive integer if true)
        //}//else {
        //    gl.uniform2fv(uniformLocations["vMouse"], new Float32Array([-1, -1]));
        //}

        gl.viewport(0, 0, screenWidth, screenHeight);
        gl.uniform1f(uniformLocations["fTime"], (Date.now()-time)/1000.0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, iChannel1);

        const dc = GetDC(NULL);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, screenBmp.bitmap);
        BitBlt(memDC, 0, 0, screenWidth, screenHeight, dc, 0, 0, SRCCOPY); //copy screen into screenBmp
        DeleteDC(memDC);
        //ReleaseDC(NULL, dc);

        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, screenWidth, screenHeight, gl.RGBA, gl.UNSIGNED_BYTE, screenBmp.GetBits()); //shoot i've never used texSubImage2D in any webgl type thing before (and apparently it's faster than texImage2D)
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, NULL, gl.RGBA, gl.UNSIGNED_BYTE, screenBmp.GetBits()); //weird i thought it would be gl.UNSIGNED_INT

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); //4 verts (no need to delay swapping buffers here because no copyTex after drawing)

        {
            if(GetKeyDown(VK_RIGHT)) {
                selected++; selected %= 5;
            }
            if(GetKeyDown(VK_LEFT)) {
                selected--; selected = Math.abs(selected)%5;
            }
            //print(selected);

            //const dc = GetDC(NULL);
            let last = SelectObject(dc, GetDefaultFont());
            const dir = (GetKeyDown(VK_UP) ? 1 : 0) || (GetKeyDown(VK_DOWN) ? -1 : 0);
            const shits = ["_Spread", "_RedColorCount", "_GreenColorCount", "_BlueColorCount", "_BayerLevel"]; //i need static in javascript that works like static in C++
            for(let i = 0; i < shits.length; i++) {
                if(i == selected) {
                    continue;
                }
                let word = shits[i];
                //globalThis[word] += (i == 0 ? dir*0.5 : dir); //had to use var for globalThis to work?
                word += ": "+globalThis[word];
                TextOut(dc, ((1/shits.length)*(i))*screenWidth, (2/3)*screenHeight, word);
            }
            SelectObject(dc, last);
            last = SelectObject(dc, impact);
            let word = shits[selected];
            globalThis[word] += (selected == 0 ? dir*0.5 : dir);
            word += ": "+globalThis[word];
            TextOut(dc, ((1/shits.length)*(selected))*screenWidth, (2/3)*screenHeight, word);
            SelectObject(dc, last);
            ReleaseDC(NULL, dc);

            if(dir) {
                gl[`uniform1${(selected == 0 ? 'f' : 'i')}`](uniformLocations[shits[selected]], globalThis[shits[selected]]);
                //RedrawWindow(NULL, 0, (2/3)*screenHeight, screenWidth, ((2/3)*screenHeight)+32, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
                //InvalidateRect(NULL, 0, (2/3)*screenHeight, screenWidth, ((2/3)*screenHeight)+32, true);
                //UpdateWindow(NULL); //draw immediately        
            }
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_TRANSPARENT, wc, "screen shader blur", WS_POPUP | WS_VISIBLE, 0, 0, screenWidth, screenHeight, NULL, NULL, hInstance);