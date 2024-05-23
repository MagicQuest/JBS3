let gl, program; //OH YEAH BABY GL IS COMING THROUGH
let canvas;
let uniformLocations = {};
let time;
let boring = false;
let dragging;

const cPos = new Float32Array([0.5, 0.5]);
const c2Pos = new Float32Array([0.7, 0.7]);
const radii = new Float32Array([0.1, 0.1]);

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

    uniform float fTime;

    out vec4 fragColor;

    uniform vec2 cPos; //circle position
    uniform vec2 c2Pos; //circle 2 position
    uniform vec2 radii; //both circle radii

    const float smoothing = 10.5;
    const float bands = 40.0;
    const float linewidth = 0.01;

    const vec3 ucolor1 = vec3(1.0, 0.0, 0.0);
    const vec3 ucolor2 = vec3(0.0, 0.3, 1.0);

    uniform int boring;

    float smin(float a, float b, float k) { //snatched from https://github.com/glslify/glsl-smooth-min/blob/master/exp.glsl
        float res = exp(-k * a) + exp(-k * b);
        return -log(res) / k;
    }

    float mapRange(float x) { //maps from 0 -> 1 to -1 -> 1 (if i wanted to stay true to the blender nodes i would've used https://twitter.com/XorDev/status/1636769680105897986's remap function) remap(a,b,c,d,x) = (x-a)/(b-a)*(d-c)+c;
        return x-1.0*(1.0-x);
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        
        float l = distance(uv, cPos)-radii[0];
        float l2 = distance(uv, c2Pos)-radii[1];

        //float combined = min(l, l2);

        float combined = smin(l, l2, smoothing);

        float compared = abs(combined) <= linewidth ? 0.0 : 1.0; //outline

        float greaterThan = combined > 0.0 ? 1.0 : 0.0;
        
        vec3 almostfinal;
        if(boring == 0) {
            float mapped = mapRange(greaterThan);
            float fractioned = fract((combined*bands)+((fTime*2.0) * mapped));
            vec3 mixedcolor = mix(ucolor1, ucolor2,greaterThan);
            almostfinal = mixedcolor*(fractioned*0.5+0.5); //0.5 is the factor in the blender multiply color node
        }else {
            //vec3 absGreater = abs(combined) > 0.0 ? 1.0 : 0.0; //lol realized this was basically just greaterThan
            almostfinal = mix(ucolor1, ucolor2,greaterThan);
        }
        vec3 FINALCOLOR = almostfinal*compared;

        fragColor = vec4(vec3(FINALCOLOR), 1.0);
}
`;

function magnitude(x,y) {
    return Math.sqrt(x**2 + y**2);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //somehow i gotta use wic to load textures
        gl = createCanvas("gl", NULL, hwnd); //for opengl the second param is null
        //gl init here
        canvas = GetClientRect(hwnd);
        gl.viewport(0,0,canvas.right,canvas.bottom);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        print(gl.VERTEX_SHADER, "VERTEX_SHADER");
        print(gl.FRAGMENT_SHADER, "FRAGMENT_SHADER");
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

        registerUniform("2fv", "iResolution", new Float32Array([canvas.right, canvas.bottom]));
        registerUniform("2fv", "cPos", cPos);
        registerUniform("2fv", "c2Pos", c2Pos);
        registerUniform("2fv", "radii", radii);
        registerUniform("1i", "boring", boring);
        registerUniform("1f", "fTime", 0.0);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); //4 verts
    
        print(gl.COLOR_BUFFER_BIT);
        print(gl.COMPILE_STATUS);
        print(gl.GetString(gl.RENDERER));
        print(gl.GetString(gl.VERSION));
        time = Date.now();
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        gl.viewport(0, 0, canvas.right, canvas.bottom);
        gl.uniform1f(uniformLocations["fTime"], (Date.now()-time)/1000.0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); //4 verts
    }else if(msg == WM_SIZE || msg == WM_SIZING) {
        canvas = GetClientRect(hwnd);
        //const size = MAKEPOINTS(lp);
        gl.uniform2fv(uniformLocations["iResolution"], new Float32Array([canvas.right, canvas.bottom]));
        //if(msg == WM_SIZE) {
        //    SetWindowPos(hwnd, NULL, 0, 0, size.x, size.x, SWP_NOMOVE | SWP_NOZORDER);
        //}
    }else if(msg == WM_RBUTTONDOWN) {
        gl.uniform1i(uniformLocations["boring"], boring = !boring);
    }else if(msg == WM_MOUSEMOVE) {
        if((wp & MK_LBUTTON) == MK_LBUTTON) {
            const mouse = MAKEPOINTS(lp);
            const coordinates = {x: mouse.x/canvas.right, y: (canvas.bottom-mouse.y)/canvas.bottom};
            if(dragging) {
                globalThis[dragging] = new Float32Array([coordinates.x, coordinates.y]);
                gl.uniform2fv(uniformLocations[dragging], globalThis[dragging]);
            }
        }
    }else if(msg == WM_LBUTTONDOWN) {
        const mouse = MAKEPOINTS(lp);
        const coordinates = {x: mouse.x/canvas.right, y: (canvas.bottom-mouse.y)/canvas.bottom};
        if(magnitude(coordinates.x - cPos[0], coordinates.y - cPos[1]) < magnitude(coordinates.x - c2Pos[0], coordinates.y - c2Pos[1])) { //if mouse is closer to cPos
            dragging = "cPos";
        }else {
            dragging = "c2Pos";
        }
    }else if(msg == WM_LBUTTONUP) {
        dragging = undefined;
    }else if(msg == WM_MOUSEWHEEL) {
        print(GET_WHEEL_DELTA_WPARAM(wp), lp); //ok no lie i had to make GET_WHEEL_DELTA_WPARAM for this
        if(dragging) {
                    //oh yeah dragging is a string holding either cPos or c2Pos
            let i = +(dragging[1] == "2"); //if dragging[1] == "2" then dragging is c2Pos meaning the radii index must be 1
            radii[i] += (GET_WHEEL_DELTA_WPARAM(wp)*.0001);
            console.log(radii);
            gl.uniform2fv(uniformLocations["radii"], radii);
        }
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

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "magicquest.github.io/games/sdfwebgl.html - (hold left click to drag | right click to toggle boring mode)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 800+16, 800+39, NULL, NULL, hInstance);