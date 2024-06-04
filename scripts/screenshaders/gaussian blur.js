let gl, program;
let uniformLocations = {};
let iChannel1; //screen texture
let screenBmp;

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

    out vec4 fragColor;

    float avg(vec3 v3) {
        return (v3.x + v3.y + v3.z)/3.0;
    }

    //im using this as the kernel https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing-continued.html
    const mat3 kernel = mat3(0.045, 0.122, 0.045, 0.122, 0.332, 0.122, 0.045, 0.122, 0.045);

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        vec3 final;

        //for(int i = -1; i <= 1; i++) {
        //    for(int j = -1; j <= 1; j++) {
        //        vec2 offset = vec2(i, j) / iResolution.xy;		 // Scale the offset down
        //        vec3 lookup = texture(iChannel1, uv + offset).zyx;  // Apply offset and sample
        //        //sum += round(lookup);
        //        final += lookup*kernel[2-(i+1)][2-(j+1)];
        //    }
        //}

        const int iBlur = 3;
        float blurAmount = pow(float(abs(iBlur)*2+1), 2.0); //came up with this bad boy for JBS3 when i randomly used convolutional blur

        for(int i = -iBlur; i <= iBlur; i += 1)
        {
            for( int j = -iBlur; j <= iBlur; j += 1)
            {
                vec2 offset = vec2(i, j) / iResolution.xy;		 // Scale the offset down
                vec3 lookup = texture(iChannel1, uv + offset).zyx;   // Apply offset and sample
                final += lookup;
            }
        }

        final /= blurAmount;

        if(distance(vMouse.xy, uv) < (vMouse.z == 1.0 ? .05 : .1)) {
            final = ((vMouse.z == 1.0) ? final*2.0 : texture(iChannel1, uv).zyx);
        }

        fragColor = vec4(final, 1.0);
    }
`;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, NULL, 255, LWA_ALPHA);
        SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE); //it's gonna work steve....

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
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, NULL, gl.RGBA, gl.UNSIGNED_BYTE, NULL); //weird i thought it would be gl.UNSIGNED_INT

        registerUniform("2fv", "iResolution", new Float32Array([screenWidth, screenHeight]));
        registerUniform("1i", "iChannel1", 1);
        registerUniform("3fv", "vMouse", new Float32Array([-1, -1, 0]));

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

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, iChannel1);

        const dc = GetDC(NULL);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, screenBmp.bitmap);
        BitBlt(memDC, 0, 0, screenWidth, screenHeight, dc, 0, 0, SRCCOPY); //copy screen into screenBmp
        DeleteDC(memDC);
        ReleaseDC(NULL, dc);

        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, screenWidth, screenHeight, gl.RGBA, gl.UNSIGNED_BYTE, screenBmp.GetBits()); //shoot i've never used texSubImage2D in any webgl type thing before (and apparently it's faster than texImage2D)
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, NULL, gl.RGBA, gl.UNSIGNED_BYTE, screenBmp.GetBits()); //weird i thought it would be gl.UNSIGNED_INT

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); //4 verts (no need to delay swapping buffers here because no copyTex after drawing)
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_TRANSPARENT, wc, "screen shader blur", WS_POPUP | WS_VISIBLE, 0, 0, screenWidth, screenHeight, NULL, NULL, hInstance);