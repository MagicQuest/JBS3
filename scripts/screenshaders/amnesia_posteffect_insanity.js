//yeah no lie im just snatching the insanity fragment shader from amnesia: the dark descent
let gl, program;
let uniformLocations = {};
let iChannel0, iAmpmap0, iAmpmap1, iAmpmap2, iZoom; //screen texture
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
//#extension GL_ARB_texture_rectangle : enable

uniform sampler2D diffuseMap;

uniform sampler2D ampMap0;

uniform sampler2D ampMap1;

uniform sampler2D zoomMap;

//uniform float afAlpha; //bruh this is unused?
uniform float afT;
uniform vec2 iResolution; //avScreenSize;
uniform float afAmpT;
uniform float afWaveAlpha;
uniform float afZoomAlpha;

out vec4 fragColor;

void main()
{
	//vec2 vTexUV = gl_TexCoord[0].xy/avScreenSize;
	vec2 vTexUV = gl_FragCoord.xy / iResolution.xy; //i think this is what they were trying to do (they were using version #120)
    vec3 vAmp = texture(ampMap0, vTexUV).xyz*(1.0-afAmpT) + texture(ampMap1, vTexUV).xyz*afAmpT;
	vAmp *= afWaveAlpha * 0.04 * iResolution.y;
	
	vec3 vZoom = texture(zoomMap, vTexUV).xyz;
	
	
	vec2 vUV = gl_FragCoord.xy;
	
	vUV += (vZoom.xy-vec2(0.5))*2.0* 0.6 * vZoom.z * iResolution.y * afZoomAlpha;
	
	vec2 vSinUv = (vUV / iResolution.y) * 0.6;
	vUV.x += sin(afT + vSinUv.y) * vAmp.x;
	vUV.y += sin(afT + vSinUv.x*1.83) * vAmp.y;
	
	vec3 vDiffuseColor = texture(diffuseMap, vUV).xyz;
	
	
	fragColor = vec4(vDiffuseColor, 1.0);
}`;

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function initCreateGlImage() {
    //haha funny closure@! (because i'm feeling fancy)
    let texture = 0;

    function createGlImage(imagedata, {width, height} = {width: screenWidth, height: screenHeight}) { //wow this is kinda insane
        let id = gl.createTexture();
        print(`TEXTURE${texture}`, width, height);
        gl.activeTexture(gl[`TEXTURE${texture}`]); texture++;
        gl.bindTexture(gl.TEXTURE_2D, id);

        //if(isPowerOf2(width) && isPowerOf2(height)) {
        //    print(width, height, "pow%2")
            //i finally have textures that are powers of 2 and im getting an error because im trying to generate the mipmaps?
            //gl.generateMipmap(gl.TEXTURE_2D);
        //}else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //TWAS linear
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        //}
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, NULL, gl.RGBA, gl.UNSIGNED_BYTE, imagedata); //weird i thought it would be gl.UNSIGNED_INT
        return id;
    }

    return createGlImage;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, NULL, 255, LWA_ALPHA);
        SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE); //it's gonna work steve....

        const wic = InitializeWIC(); ScopeGUIDs(wic);
        const createGlImage = initCreateGlImage();

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

        const dc = GetDC(NULL);
        screenBmp = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, screenHeight, 32, 1, 0), DIB_RGB_COLORS);
        print(screenWidth, screenHeight, "100%");
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, screenBmp.bitmap);
        BitBlt(memDC, 0, 0, screenWidth, screenHeight, dc, 0, 0, SRCCOPY); //copy screen into screenBmp
        DeleteDC(memDC);
        //        const dc = GetDC(NULL); //i was about to add a ton of gdi bullshit but luckily i remembered that WIC can load all the images i want and there's a GetPixels function so i can say goodbye to gdi for this part
//
        //white = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, screenHeight, 32, 1, 0), DIB_RGB_COLORS);
        ////const whitebrush = CreateSolidBrush(RGB(255, 255, 255));
        //const memDC = CreateCompatibleDC(dc);
        //SelectObject(memDC, white); //oh wait i need to do .bitmap (well not anymore!)
        //SelectObject(memDC, WHITE_BRUSH);
        ////SetDCBrushColor(memDC, RGB(255, 255, 255));
        //FillRect(memDC, 0, 0, screenWidth, screenHeight, NULL);//whitebrush);
        //DeleteDC(memDC);

        ReleaseDC(NULL, dc);

        const ampmap0 = wic.LoadBitmapFromFilename(__dirname+"/posteffect_insanity_ampmap0.jpg", wic.GUID_WICPixelFormat32bppPBGRA);
        const ampmap1 = wic.LoadBitmapFromFilename(__dirname+"/posteffect_insanity_ampmap1.jpg", wic.GUID_WICPixelFormat32bppPBGRA);
        const ampmap2 = wic.LoadBitmapFromFilename(__dirname+"/posteffect_insanity_ampmap2.jpg", wic.GUID_WICPixelFormat32bppPBGRA);
        const zoom = wic.LoadBitmapFromFilename(__dirname+"/posteffect_insanity_zoom.jpg", wic.GUID_WICPixelFormat32bppPBGRA);

        iChannel0 = createGlImage(NULL);

        iAmpmap0 = createGlImage(ampmap0.GetPixels(wic), ampmap0.GetSize());
        iAmpmap1 = createGlImage(ampmap1.GetPixels(wic), ampmap1.GetSize());
        iAmpmap2 = createGlImage(ampmap2.GetPixels(wic), ampmap2.GetSize());
        iZoom = createGlImage(zoom.GetPixels(wic), zoom.GetSize());

        registerUniform("2fv", "iResolution", new Float32Array([screenWidth, screenHeight]));
        registerUniform("1i", "diffuseMap", 0);
        registerUniform("1i", "ampMap0", 1);
        registerUniform("1i", "ampMap1", 2);
        registerUniform("1i", "ampMap2", 3);
        registerUniform("1i", "zoomMap", 4);
        registerUniform("1f", "afT", 0.0);
        registerUniform("1f", "afAmpT", 0.0);
        registerUniform("1f", "afWaveAlpha", 0.0);
        registerUniform("1f", "afZoomAlpha", 1.0);

        //print(gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)); //4 verts
    
        print(gl.COLOR_BUFFER_BIT);
        print(gl.COMPILE_STATUS);
        print(gl.GetString(gl.RENDERER));
        print(gl.GetString(gl.VERSION));
        time = Date.now();

        ampmap0.Release();
        ampmap1.Release();
        ampmap2.Release();
        zoom.Release();
        wic.Release();
        //RedrawWindow(hwnd, 0, 0, windowcx, windowcy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_LBUTTONDOWN || msg == WM_TIMER) {
        if(GetKey(VK_ESCAPE)) {
            DestroyWindow(hwnd);
            return;
        }
        //if(GetKey(VK_LBUTTON)) {
            //const mouse = GetCursorPos();
            //gl.uniform3fv(uniformLocations["vMouse"], new Float32Array([mouse.x/screenWidth, 1-(mouse.y/screenHeight), GetKey(VK_LBUTTON) > 0])); //using z to tell if mouse is down (GetKey returns some positive integer if true)
        //}//else {
        //    gl.uniform2fv(uniformLocations["vMouse"], new Float32Array([-1, -1]));
        //}

        gl.viewport(0, 0, screenWidth, screenHeight);
        gl.uniform1f(uniformLocations["afT"], (Date.now()-time)/1000.0);
        //gl.uniform1f(uniformLocations["afAmpT"], (Date.now()-time)/10000.0);
        gl.uniform1f(uniformLocations["afWaveAlpha"], (Date.now()-time)/10000.0);
        print((Date.now()-time)/10000.0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, iChannel0);

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

window = CreateWindow(WS_EX_LAYERED | WS_EX_TRANSPARENT, wc, "screen shader blur", WS_POPUP | WS_VISIBLE, 0, 0, screenWidth, screenHeight, NULL, NULL, hInstance);