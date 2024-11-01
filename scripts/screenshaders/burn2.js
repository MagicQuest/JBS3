//based on my https://magicquest.github.io/ca/webgl/burn2.html

const vertex_shader = `#version 300 es
    precision highp float;

    in vec2 vertPosition;

    out vec4 fragColor;

    void main() {
        gl_Position = vec4(vertPosition, 0.0, 1.0);
    }
`;

const cnn_shader = `#version 300 es
    precision highp float;

    uniform vec2 iResolution;

    uniform sampler2D iChannel0;
    uniform sampler2D iChannel2;

    uniform vec3 vMouse;

    uniform vec3 f1;
    uniform vec3 f2;
    uniform vec3 f3;

    uniform float fCutoff;

    out vec4 fragColor;

    float activate(float x) {
        return abs(x/1.5);
    }

    float lerp(float a, float b, float t) {
        return (b - a) * t + a;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        vec3 color = vec3(0.0); //texture(iChannel0, uv).xyz;

        float sum = 0.0;

        for(int i = -1; i <= 1; i += 1)
        {
            for( int j = -1; j <= 1; j += 1)
            {
                vec2 offset = vec2(i, j) / iResolution.xy;		 // Scale the offset down
                vec4 lookup = texture(iChannel0, uv + offset);   // Apply offset and sample
                //sum += lookup.x;
                if(i == -1) {
                    sum += (lookup.x)*f1[2-(j+1)]; //getting rid of (texture(iChannel2, uv).x)* on here and        look the best
                }else if(i == 0) {
                    sum += (lookup.x)*f2[2-(j+1)]; //2-(j+1) reflects it and make the fire go up and not down
                }else if(i == 1) {
                    sum += (lookup.x)*f3[2-(j+1)];                               //here 
                }
            }
        }

        sum = clamp(sum, -1., 1.);

        color = vec3((texture(iChannel2, uv).x > fCutoff ? 1. : .84)*activate(sum), sum > .8 ? lerp(.91, .0, clamp((texture(iChannel2, uv).x > fCutoff ? 1. : .84)*activate(sum), 0., 1.)) : 0.0, 0.);

        if(distance(vMouse.xy, uv) < (vMouse.z == 0.0 ? .1 : .025)) {
            color = vec3(vMouse.z);
        }

        fragColor = vec4(color, 1.0);
    }
`;

const blur_fshader = `#version 300 es
    precision highp float;

    uniform vec2 iResolution;

    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;

    uniform int iBlur;

    out vec4 fragColor;

    uniform int bAlpha;

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        vec4 FINALCOLOR = vec4(0.0);

        float ex = texture(iChannel0, uv).x;

        if(ex > 0.05) {
        
            vec4 average;

            //float blurAmount = pow(float(abs(-iBlur)*2+1), 2.0); //came up with this bad boy for JBS3 when i randomly used convolutional blur

            for(int i = -iBlur; i <= iBlur; i += 1)
            {
                for( int j = -iBlur; j <= iBlur; j += 1)
                {
                    vec2 offset = vec2(i, j) / iResolution.xy;		 // Scale the offset down
                    vec4 lookup = texture(iChannel0, uv + offset);   // Apply offset and sample
                    average += lookup;
                    //average += texture(iChannel1, uv+offset);
                }
            }

            FINALCOLOR = average / 2.0; //blurAmount;

        }else {
            FINALCOLOR = texture(iChannel1, uv).bgra*texture(iChannel2, uv); //swizzle!
        }

        fragColor = bAlpha == 1 ? FINALCOLOR : vec4(FINALCOLOR.xyz, 1.0);
    }
`;

const burning_shader = `#version 300 es
    precision highp float; //the google says this don't even matter on pc https://www.reddit.com/r/GraphicsProgramming/comments/104q9ww/precision_highp_mediump_lowp_in_webglopengl/

    uniform vec2 iResolution;

    uniform sampler2D iChannel0;
    //uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;

    uniform float fFireDamage;

    out vec4 fragColor;

    uniform int bAlpha;

    //uniform float fTime;
    uniform int fInc;

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;

        vec4 allow = texture(iChannel2, uv);

        float fire = texture(iChannel0, uv).x;

        //if(fInc % 8 == 0) {
        //    allow = min(allow+vec4(.005,.005,.005,0.0), vec4(1.0,1.0,1.0,1.0));
        //}
        //allow = min(allow+vec4(.005,.005,.005,0.0), vec4(1.0,1.0,1.0,1.0)); //.005 is still too high but this shit is not precise enough (hold on) 

        if(fire > 0.05) {
            allow -= vec4(fire/fFireDamage);
        }

        fragColor = bAlpha == 1 ? allow : vec4(allow.xyz, 1.0);
    }
`;

let programs = [];
let screenBmp;
let white, black;
let cycleDraws = 0;
let i = 0;

const uniformLocations = {};
const uniformLocations2 = {};
const uniformLocations3 = {};

//let wic;

const rect = [
    -1,1,
    -1,-1,
    1,-1,
    1,1,
];

function cleanup() {
    gl.useProgram(null);
    programs[0] && gl.deleteProgram(programs[0]); //lazy man's if statement (write dumb code)
    programs[1] && gl.deleteProgram(programs[1]);
    programs[2] && gl.deleteProgram(programs[2]);
}

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

function clearFire() {
    gl.activeTexture(gl.TEXTURE0); //oh my questions have finally been answered, and i was just about to ask chat too! (you call activeTexture first and bindTexture assigns iChannel0 to gl.TEXTURE0) https://webglfundamentals.org/webgl/lessons/webgl-2-textures.html
    gl.bindTexture(gl.TEXTURE_2D, iChannel0);
    //loadImage(document.getElementById("image"));
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, NULL, gl.RGBA, gl.UNSIGNED_BYTE, black.GetBits()); //weird i thought it would be gl.UNSIGNED_INT (wait the rgb values are 0-255 so yeah idk why i thought it was unsigned int (probably because im using DWORD* behind the scenes for DIBSection shits))
}

function reset() {
    clearFire();

    //gl.activeTexture(gl.TEXTURE1);
    //gl.bindTexture(gl.TEXTURE_2D, iChannel1);
    //loadImage(document.getElementById("realimg"));

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, iChannel2);
    //loadImage(document.getElementById("allowimg"));
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, NULL, gl.RGBA, gl.UNSIGNED_BYTE, white.GetBits()); //weird i thought it would be gl.UNSIGNED_INT (wait the rgb values are 0-255 so yeah idk why i thought it was unsigned int (probably because im using DWORD* behind the scenes for DIBSection shits))


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, iChannel0); //rebind as active texture
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, NULL, 255, LWA_ALPHA);
        SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE); //it's gonna work steve....

        //wic = InitializeWIC();
        //ScopeGUIDs(wic);

        gl = createCanvas("gl", NULL, hwnd); //for opengl the second param is null
        //gl init here
        gl.viewport(0,0,screenWidth,screenHeight);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        let source = vertex_shader;
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, source);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            print('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
            return;
        }

        source = cnn_shader;
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, source);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            print('ERROR compiling cnn fragment shader!', gl.getShaderInfoLog(fragmentShader));
            return;
        }

        source = blur_fshader;
        const blurfShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(blurfShader, source);
        gl.compileShader(blurfShader);
        if (!gl.getShaderParameter(blurfShader, gl.COMPILE_STATUS)) {
            print('ERROR compiling blurf shader!', gl.getShaderInfoLog(blurfShader));
            return;
        }

        source = burning_shader;
        const burningShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(burningShader, source);
        gl.compileShader(burningShader);
        if (!gl.getShaderParameter(burningShader, gl.COMPILE_STATUS)) {
            print('ERROR compiling burning shader!', gl.getShaderInfoLog(burningShader));
            return;
        }

        programs.push(createProgram(vertexShader, fragmentShader, 0));
        programs.push(createProgram(vertexShader, blurfShader, 1));
        programs.push(createProgram(vertexShader, burningShader, 2));

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteShader(blurfShader);
        gl.deleteShader(burningShader);

        let rectVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rectVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rect), gl.STATIC_DRAW);

        for(let i = 0; i < programs.length; i++) {
            let pAL = gl.getAttribLocation(programs[i], 'vertPosition'); 
            gl.vertexAttribPointer(pAL, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
            gl.enableVertexAttribArray(pAL);

            gl.useProgram(programs[i]);

            let res = gl.getUniformLocation(programs[i], "iResolution");
            gl.uniform2fv(res, new Float32Array([screenWidth, screenHeight]));
        }

        gl.useProgram(programs[0]);

        function isPowerOf2(value) {
            return (value & (value - 1)) === 0;
        }

        const dc = GetDC(NULL);

        white = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, screenHeight, 32, 1, 0), DIB_RGB_COLORS);
        //const whitebrush = CreateSolidBrush(RGB(255, 255, 255));
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, white); //oh wait i need to do .bitmap (well not anymore!)
        SelectObject(memDC, WHITE_BRUSH);
        //SetDCBrushColor(memDC, RGB(255, 255, 255));
        FillRect(memDC, 0, 0, screenWidth, screenHeight, NULL);//whitebrush);
        DeleteDC(memDC);
        
        black = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, screenHeight, 32, 1, 0), DIB_RGB_COLORS); //ha this ones probably already black!
        
        iChannel0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0); //oh my questions have finally been answered, and i was just about to ask chat too! (you call activeTexture first and bindTexture assigns iChannel0 to gl.TEXTURE0) https://webglfundamentals.org/webgl/lessons/webgl-2-textures.html
        gl.bindTexture(gl.TEXTURE_2D, iChannel0);
        //await newTexture();
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //lol you were supposed to do this BEFORE using texImage2D
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, NULL, gl.RGBA, gl.UNSIGNED_BYTE, black.GetBits()); //weird i thought it would be gl.UNSIGNED_INT (wait the rgb values are 0-255 so yeah idk why i thought it was unsigned int (probably because im using DWORD* behind the scenes for DIBSection shits))
        
        if(isPowerOf2(screenWidth) && isPowerOf2(screenHeight)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //TWAS linear
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        //loadImage(document.getElementById("image"));

        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 800, 800, 0, gl.RGBA, gl.UNSIGNED_BYTE, );//new Uint8Array([255,255,0,255])); //oops if i wanted to use a Uint8Array i would have to set EVERY pixel

        screenBmp = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, screenHeight, 32, 1, 0), DIB_RGB_COLORS);
        print(screenWidth, screenHeight, "100%");

        iChannel1 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, iChannel1);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, NULL, gl.RGBA, gl.UNSIGNED_BYTE, NULL); //weird i thought it would be gl.UNSIGNED_INT (wait the rgb values are 0-255 so yeah idk why i thought it was unsigned int (probably because im using DWORD* behind the scenes for DIBSection shits))
        
        if(isPowerOf2(screenWidth) && isPowerOf2(screenHeight)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //TWAS linear
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        iChannel2 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, iChannel2);
        //loadImage(document.getElementById("allowimg"));
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, screenWidth, screenHeight, NULL, gl.RGBA, gl.UNSIGNED_BYTE, white.GetBits()); //weird i thought it would be gl.UNSIGNED_INT (wait the rgb values are 0-255 so yeah idk why i thought it was unsigned int (probably because im using DWORD* behind the scenes for DIBSection shits))
        
        if(isPowerOf2(screenWidth) && isPowerOf2(screenHeight)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //TWAS linear
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        ReleaseDC(NULL, dc);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, iChannel0); //rebind as active texture

        function registerUniform(type, name, value) {
            uniformLocations[name] = gl.getUniformLocation(programs[0], name);
            gl[`uniform${type}`](uniformLocations[name], value);
        }
        function registerUniform2(type, name, value) {
            uniformLocations2[name] = gl.getUniformLocation(programs[1], name);
            gl[`uniform${type}`](uniformLocations2[name], value);
        }
        function registerUniform3(type, name, value) {
            uniformLocations3[name] = gl.getUniformLocation(programs[2], name);
            gl[`uniform${type}`](uniformLocations3[name], value);
        }
        function setUniform(type, name, value, i = 0) {
            gl[`uniform${type}`](gl.getUniformLocation(programs[i], name), value);
        }

        setUniform("1i", "iChannel0", 0);
        setUniform("1i", "iChannel2", 2);
        //registerUniform("1i", "iTime", 0);
        registerUniform("3fv", "vMouse", new Float32Array([-1,-1,1]));

        setUniform("3fv", "f1", new Float32Array([.808,.927,-.987])); //fire cca (oh shoot idk if this gone work)
        setUniform("3fv", "f2", new Float32Array([-.875,-.816,.867]));
        setUniform("3fv", "f3", new Float32Array([.274,.272,.37]));

        registerUniform("1f", "fCutoff", .5);

        gl.useProgram(programs[1]);

        //setUniform("2fv", "iResolution", new Float32Array([screenWidth, screenHeight]));

        setUniform("1i", "iChannel0", 0, 1);
        setUniform("1i", "iChannel1", 1, 1);
        setUniform("1i", "iChannel2", 2, 1);
        registerUniform2("1i", "iBlur", 1); //, 1); //oops i left the parameters on
        registerUniform2("1i", "bAlpha", false);

        gl.useProgram(programs[2]);

        setUniform("1i", "iChannel0", 0, 2);
        setUniform("1i", "iChannel2", 2, 2);
        registerUniform3("1f", "fFireDamage", 25.5);
        registerUniform3("1i", "bAlpha", false); //, 2);
        registerUniform3("1i", "fInc", 0);

        gl.useProgram(programs[0]);

        //gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); //4 verts

        time = Date.now();
        i = 0;

        //RedrawWindow(hwnd, 0, 0, windowcx, windowcy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        if(GetKey(VK_ESCAPE)) {
            DestroyWindow(hwnd);
            return;
        }
        const mouse = GetCursorPos();
        if(GetKey(VK_LBUTTON) || GetKey(VK_RBUTTON)) {
            gl.uniform3fv(uniformLocations["vMouse"], new Float32Array([mouse.x/screenWidth, 1-(mouse.y/screenHeight), GetKey(VK_LBUTTON)])); //using z to tell if mouse is down (GetKey returns some positive integer if true)
        }else {
            gl.uniform3fv(uniformLocations["vMouse"], new Float32Array([-1,-1,1])); //using z to tell if mouse is down (GetKey returns some positive integer if true)
        }

        if(GetKeyDown('T')) {
            cycleDraws = (cycleDraws + 1) % 3;
        }else if(GetKeyDown('C')) {
            clearFire();
        }else if(GetKeyDown('R')) {
            reset();
        }

        gl.viewport(0, 0, screenWidth, screenHeight);

        gl.activeTexture(gl.TEXTURE1);
        //gl.bindTexture(gl.TEXTURE_2D, iChannel1); //uh oh... i think i've been misunderstanding what this function does and im starting to think you only need to call it once? (i mean come on the docs don't give it any justice wtf does this shit do?) https://stackoverflow.com/questions/36349985/bind-a-texture-before-draw-it-webgl

        const dc = GetDC(NULL); //wait why do i get the dc everytime instead of just getting it once? (idk it's probably not that bad)
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, screenBmp.bitmap);
        BitBlt(memDC, 0, 0, screenWidth, screenHeight, dc, 0, 0, SRCCOPY); //copy screen into screenBmp
        DeleteDC(memDC);
        ReleaseDC(NULL, dc);

        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, screenWidth, screenHeight, gl.RGBA, gl.UNSIGNED_BYTE, screenBmp.GetBits()); //shoot i've never used texSubImage2D in any webgl type thing before (and apparently it's faster than texImage2D)

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4, true); //4 verts

        gl.activeTexture(gl.TEXTURE0);
        //gl.bindTexture(gl.TEXTURE_2D, iChannel0); //rebind as active texture

        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, screenWidth, screenHeight, 0);

        gl.useProgram(programs[2]);

        gl.uniform1i(uniformLocations3["fInc"], i); //only dividing by 100 on purpose

        if(cycleDraws == 0 || cycleDraws == 2) {
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4, true); //4 verts

            gl.activeTexture(gl.TEXTURE2);
            //gl.bindTexture(gl.TEXTURE_2D, iChannel2); //rebind as active texture

            gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, screenWidth, screenHeight, 0);
        }

        gl.useProgram(programs[1]);

        if(cycleDraws == 0) {
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4, true); //4 verts
        }
        
        gl.useProgram(programs[0]);

        gl.swapBuffers(); //erm
        i++;
    }/*else if(msg == WM_KEYDOWN) { //oh yeah oops WS_EX_LAYERED and WS_EX_TRANSPARENT stop this window from receiving this event
        if(wp == "T".charCodeAt(0)) {
            cycleDraws = (cycleDraws + 1) % 3;
        }else if(wp == "C".charCodeAt(0)) {
            clearFire();
        }else if(wp == "R".charCodeAt(0)) {
            reset();
        }
    }*/
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_TRANSPARENT, wc, "burn2", WS_POPUP | WS_VISIBLE, 0, 0, screenWidth, screenHeight, NULL, NULL, hInstance);