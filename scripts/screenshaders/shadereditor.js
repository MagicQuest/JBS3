//for later:
//https://learn.microsoft.com/en-us/windows/win32/controls/create-a-list-view-control
//https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-initcommoncontrolsex
//https://github.com/MicrosoftDocs/win32/blob/docs/desktop-src/Controls/create-an-owner-drawn-list-box.md
//https://learn.microsoft.com/en-us/windows/win32/shell/datascenarios#copying-the-contents-of-a-dropped-file-into-an-application
//https://learn.microsoft.com/en-us/windows/win32/dataxchg/using-the-clipboard <-----

//https://stackoverflow.com/questions/12345435/drag-and-drop-support-for-win32-gui
//https://learn.microsoft.com/en-us/windows/win32/controls/list-view-control-reference?redirectedfrom=MSDN
//https://www.codeproject.com/Articles/1298/Rearrange-rows-in-a-ListView-control-by-drag-and-d
//https://devblogs.microsoft.com/oldnewthing/20080311-00/?p=23153

//https://www.youtube.com/watch?v=GAFZHOpFWIo
//https://www.youtube.com/watch?v=LKXAIuCaKAQ
//https://www.youtube.com/watch?v=VEnglRKNHjU

//https://youtu.be/VEnglRKNHjU?t=273

//https://stackoverflow.com/questions/39731497/create-window-without-titlebar-with-resizable-border-and-without-bogus-6px-whit
//https://stackoverflow.com/questions/2398746/removing-window-border?rq=3

const Int_To_WM = function() { //this gotta be the only good reason to use a closure
    const wm = {}; //with a closure im using wm like it's static!!!
    Object.entries(globalThis).filter(([key, value]) => {
        let k = key.indexOf("WM_") == 0;
        k && (wm[value] = key); //since Object.entries returns stuff like [["WM_PAINT", 0], ["WM_CREATE", 1]] im just setting the values directly (also im swapping key and value here so it's easier to get the name of the message by the number)
        return k;
    });

    function Int_To_WM(msg) {
        return wm[msg];
    }
    return Int_To_WM;
}();

//const Int_To_WM = closure();

const w = 800;
const h = 600;

//whachu fucking know about 

function loadwicawndfuggetaboutit() {
    const wic = InitializeWIC(); ScopeGUIDs(wic);
    const bitmp = wic.LoadBitmapFromFilename(__dirname+"/shadereditor.png", wic.GUID_WICPixelFormat32bppPBGRA, 0);
    const bits = bitmp.GetPixels(wic);
    bitmp.Release();
    wic.Release();

    return bits;
}

const drawing = loadwicawndfuggetaboutit();

class GDI {
    static toCOLOR16s(r, g, b) {
        return [(r << 8) | r, (g << 8) | g, (b << 8) | b];
    }
    static Matrix3x2FToXFORM(matrix) {
        //print(matrix);
        return {
            "eM11": matrix._11,
            "eM12": matrix._12,
            "eM21": matrix._21,
            "eM22": matrix._22,
            "eDx": matrix.dx,
            "eDy": matrix.dy,
        };
    }
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

class Texture {
    static isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    constructor(id, width, height, bits) {
        this.texture = gl.createTexture();
        this.id = id;
        gl.activeTexture(id); //oh my questions have finally been answered, and i was just about to ask chat too! (you call activeTexture first and bindTexture assigns iChannel0 to gl.TEXTURE0) https://webglfundamentals.org/webgl/lessons/webgl-2-textures.html
        gl.bindTexture(gl.TEXTURE_2D, this.texture); //https://stackoverflow.com/questions/36349985/bind-a-texture-before-draw-it-webgl
        //await newTexture();
        
        if(bits) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, NULL, gl.RGBA, gl.UNSIGNED_BYTE, bits); //weird i thought it would be gl.UNSIGNED_INT (wait the rgb values are 0-255 so yeah idk why i thought it was unsigned int (probably because im using DWORD* behind the scenes for DIBSection shits))
        }

        if(Texture.isPowerOf2(width) && Texture.isPowerOf2(height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //TWAS linear
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
    }

    rebind(newid) {
        gl.activeTexture(this.id);
        gl.bindTexture(gl.TEXTURE_2D, 0);

        gl.activeTexture(newid);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
        this.id = newid;
    }

    activate() {
        gl.activeTexture(this.id);
    }

    get() {
        return this.texture;
    }
}

class Program {
    err = false;
    constructor(vertexid, fragmentid, name) {
        this.program = gl.createProgram();
        this.vertexid = vertexid;
        this.fragmentid = fragmentid;

        const vertex = GLManager.shaders[vertexid];
        const fragment = GLManager.shaders[fragmentid];

        gl.attachShader(this.program, vertex);
        gl.attachShader(this.program, fragment);
    
        gl.linkProgram(this.program);
    
        gl.detachShader(this.program, vertex);
        gl.detachShader(this.program, fragment);
    
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            const linkErrLog = gl.getProgramInfoLog(this.program);
            //cleanup();
            print(`Shader program ${name} did not link successfully. Error log: ${linkErrLog}`);
            this.err = true;
            //document.querySelector(
            //"p"
            //).textContent = `Shader program #${i} did not link successfully. Error log: ${linkErrLog}`;
            //return;
        }
    }

    registerUniform(type, name, value) {
        this.uniformLocations[name] = gl.getUniformLocation(this.program, name);
        //gl[`uniform${type}`](this.uniformLocations[name], value);
        this.setUniform(type, name, value);
    }

    setUniform(type, name, value) {
        gl[`uniform${type}`](this.uniformLocations[name], value);
    }

    get() {
        return this.program;
    }
}

class GLManager {
    static programs = [];
    static shaders = [];

    constructor() {

    }
}

GLManager.programs.push({name: "fortnite", vertexid: 0, fragmentid: 1}, {name: "fortnite", vertexid: 0, fragmentid: 1}  );

class OtherWindow { //https://www.youtube.com/watch?v=24Eh2-DZTgQ
    hover = false;
    hoverTimer = 0;
    static resizeHeight = 10;
    d2d = undefined;
    handleGradientBrush = undefined;
    windowGradientBrush = undefined;
    colorBrush = undefined;
    font = undefined;
    width = w;
    height = h-325;
    
    //static gradientRectVertices = [ //for when i used GDI in WM_PAINT
    //    [0, 0, ...GDI.toCOLOR16s(0, 255, 0), 0], //im using (0, 0) here and (1, resizeHeight) as the upper-left and bottom-right so i can transform these hoes later (with SaveDC)
    //    [1, OtherWindow.resizeHeight, ...GDI.toCOLOR16s(0, 0, 255), 0],
    //];
    //static gRect = [
    //    [0, 1], //indexes of the upper-left and bottom-right vertices (of gradientRectVertices)
    //];

    constructor(hwnd) {
        this.parent = hwnd;
        let otherwc = CreateWindowClass("otherw", this.windowProc.bind(this)); //OOPS i didn't bind this and my variables were global?! (i was gonna make em static but it looked ugly lmao)
        otherwc.hbrBackground = COLOR_BACKGROUND;
        otherwc.hCursor = LoadCursor(NULL, IDC_HAND);
        otherwc.DefWindowProc = false;
        //otherwc.style = CS_HREDRAW | CS_VREDRAW; //oops this was causing flickering
        CreateWindow(NULL, otherwc, NULL, (WS_SIZEBOX | WS_CHILD | WS_VISIBLE) ^ (WS_BORDER | WS_THICKFRAME), 0, 325, w, h-325, hwnd, NULL, hInstance); //why can'yt you do WS_POPUP with WS_CHILD
        //print("closed otherwnd");
    }

    static padding = 22;

    redraw() {
        this.d2d.BeginDraw();
        this.d2d.Clear(200/255, 200/255, 200/255); //COLOR_BACKGROUND (MAYBE) is 0xC8C8C8 (200, 200, 200) but for some reason when i use GetSysColor AND check the registry (Computer\HKEY_CURRENT_USER\Control Panel\Colors) it's 0
        //this.handleGradientBrush.SetTransform(Matrix3x2F.Rotation(this.k, w/2, OtherWindow.resizeHeight/2));
        this.d2d.FillRectangle(0, 0, w, OtherWindow.resizeHeight, this.handleGradientBrush);
        
        const squareheightcalc = this.height-(OtherWindow.padding*2);
        const toppadding = 16; //additional
        for(let i = 0; i < GLManager.programs.length; i++) {
            const p = GLManager.programs[i];
            //this.d2d.SaveDrawingState();
            //this.windowGradientBrush.SetTransform();
            //this.d2d.RestoreDrawingState();
            this.colorBrush.SetColor(0.0, 0.0, 0.0);

            //const OtherWindow.padding = 22;
            const x = OtherWindow.padding + (OtherWindow.padding+squareheightcalc)*i;
            const y = OtherWindow.padding;

            this.windowGradientBrush.SetTransform(Matrix3x2F.Multiply(Matrix3x2F.Translation(x, y), Matrix3x2F.Scale(squareheightcalc/100, squareheightcalc/100, x, y)));

            this.d2d.DrawRectangle(x, y, x+squareheightcalc, y+squareheightcalc, this.colorBrush);
            this.d2d.FillRectangle(x, y, x+squareheightcalc, y+squareheightcalc, this.windowGradientBrush);
            this.d2d.DrawText(`Program ${p.name} #${i}`, this.font, x/*+(text.length*(this.font.GetFontSize()/2))/2*/, y, x+squareheightcalc, y+squareheightcalc, this.colorBrush);

            const strings = [`Vertex shader #${p.vertexid}`, `Fragment shader #${p.fragmentid}`];

            let addpadding = toppadding;
            for(let j = 0; j < 3; j++) {
                this.d2d.DrawRectangle(x+OtherWindow.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, this.colorBrush);
                this.d2d.FillRectangle(x+OtherWindow.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, this.windowGradientBrush);
                if(j < 2) {
                    this.d2d.DrawText(strings[j], this.font, x+OtherWindow.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, this.colorBrush);
                }else {
                    
                }
                addpadding += toppadding;
            }
        }
        const radius = OtherWindow.padding+8;
        const xforplus = radius + (radius+squareheightcalc)*GLManager.programs.length;
        this.colorBrush.SetColor(0.0, 0.0, 0.0, 0.2);
        this.d2d.FillEllipse(xforplus, this.height/2, radius, radius, this.colorBrush);
        this.colorBrush.SetColor(.2, .2, .2, 1.0);
        this.d2d.FillRectangle(xforplus-(radius/6), this.height/2-radius/1.5, xforplus+(radius/6), this.height/2+radius/1.5, this.colorBrush);
        this.d2d.FillRectangle(xforplus-(radius/1.5), this.height/2-(radius/6), xforplus+radius/1.5, this.height/2+(radius/6), this.colorBrush);
        
        this.d2d.EndDraw();
    }

    windowProc(hwnd, msg, wp, lp) { //OK LOWKEY i decided not to use WM_NCPAINT because i can just use WM_NCHITTEST to say when it's resizable
        //let change = 0;
        //let lastHover = this.hover;
        if(msg == WM_CREATE) {
            this.d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
            this.colorBrush = this.d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);
            this.windowGradientBrush = this.d2d.CreateLinearGradientBrush(0,0,100,100,this.d2d.CreateGradientStopCollection([0.0, 204/255, 204/255, 204/255], [0.5, 178/255, 212/255, 167/255], [1.0, 178/255, 212/255, 1.0]));
            this.handleGradientBrush = this.d2d.CreateLinearGradientBrush(0, 0, 0, OtherWindow.resizeHeight, this.d2d.CreateGradientStopCollection([0.0, 0.0, 1.0, 0.0], [1.0, 0.0, 0.0, 1.0])); //ohhhhh the direction of the gradient is based on the upper-left and bottom-right coordinate you put
            //this.handleGradientBrush.SetTransform(Matrix3x2F.Rotation(Math.PI/2, 0, 0));
            this.font = this.d2d.CreateFont(NULL, 12);
            this.font.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);

            this.windowGradientBrush.SetTransform(Matrix3x2F.Scale(2.31, 2.31, 0, 0));

            this.redraw();
            //DwmExtendFrameIntoClientArea(hwnd, -1, -1, -1, -1); //nothing happened lol
            //DwmExtendFrameIntoClientArea(hwnd, 530, 50, 50, 50); //nothing happened lol
        }//else if(msg == WM_MOUSEHOVER) { //bruh you need to use TrackMouseEvent if i want to receive this event https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-mousehover
        else if(msg == WM_MOUSEMOVE) { //im using mousemove instead of mousehover because when you use TrackMouseEvent the mouse has to already be over the window according to MSDN: This flag (TME_HOVER) is ignored if the mouse pointer is not over the specified window or area.
            //SetWindowLongPtr(hwnd, GWL_STYLE, GetWindowLongPtr(hwnd, GWL_STYLE) | WS_THICKFRAME);
            //this.hover = true;
        }else if(msg == WM_MOUSELEAVE) {
            //SetWindowLongPtr(hwnd, GWL_STYLE, GetWindowLongPtr(hwnd, GWL_STYLE) ^ (WS_THICKFRAME));
            //this.hover = false;
        }/*else if(msg == WM_NCPAINT) { //nonclient paint! https://learn.microsoft.com/en-us/windows/win32/gdi/wm-ncpaint
            //const {left, right, top, bottom, complexity} = GetRgnBox(wp);
            //if(complexity > NULLREGION) { //NULLREGION is 1 but complexity can be 0 if it failed
                //const hdc = GetDCEx(hwnd, wp, DCX_WINDOW | DCX_INTERSECTRGN); //nah the google says to use GetWindowDC() https://stackoverflow.com/questions/5409354/getdcex-returns-null-before-form-show-drawing-on-the-non-client-area
                DefWindowProc(hwnd, msg, wp, lp);
                
                const hdc = GetWindowDC(hwnd);
                if(hdc) { //nothing happens if hdc is 0 but im adding the check anyway
                    const {left, right, top, bottom} = GetWindowRect(hwnd);
                    //const topleft = {x: left, y: top};
                    //ScreenToClient(hwnd, topleft);
                    //print(left, right, top, bottom, topleft);
                    const oldbrush = SelectObject(hdc, GetStockObject(DC_BRUSH));
                    SetDCBrushColor(hdc, RGB(127, 255, 127));
                    FillRect(hdc, 0, 0, right, bottom, NULL); //COLOR_BACKGROUND+1); //lol idk what that was doing
                    //print(wp, GetRgnBox(wp), FillRgn(hdc, wp, NULL), "fillrgn");
                    SelectObject(hdc, oldbrush);
                    ReleaseDC(hwnd, hdc);
                }

                return 0;
            //}
            //print(GetRgnBox(wp));
        }*/else if(msg == WM_PAINT) {
            /*const {left, right, top, bottom} = GetWindowRect(hwnd);

            const ps = BeginPaint(hwnd);
            FillRect(ps.hdc, 0, 0, right, bottom, COLOR_BACKGROUND); //sometimes it doesn't automagically draw the background color
            SaveDC(ps.hdc);
            SetGraphicsMode(ps.hdc, GM_ADVANCED);
            SetWorldTransform(ps.hdc, GDI.Matrix3x2FToXFORM(Matrix3x2F.Scale(w, 1, 0, 0))); //hell yeah        
            GradientFill(ps.hdc, OtherWindow.gradientRectVertices, OtherWindow.gRect, GRADIENT_FILL_RECT_V); //lowkey i did all this but i'm probably not gonna use gdi for this lmao
            RestoreDC(ps.hdc);
            EndPaint(hwnd, ps);*/
            this.redraw();
        }/*else if(msg == WM_TIMER) {
            KillTimer(hwnd, 1);
            this.hoverTimer = 0;
            const rect = GetWindowRect(hwnd);
            //SetWindowLongPtr(hwnd, GWL_STYLE, GetWindowLongPtr(hwnd, GWL_STYLE) ^ (WS_THICKFRAME));
            //SetWindowPos(hwnd, NULL, rect.left, rect.top+5, rect.right-rect.left, rect.bottom-rect.top-10, SWP_NOMOVE | SWP_NOZORDER);
        }*/else if(msg == WM_NCHITTEST) { //https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-nchittest       https://devblogs.microsoft.com/oldnewthing/20110218-00/?p=11453
            const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
            ScreenToClient(hwnd, mouse); //[in] hwnd, [out] mouse!!! this function returns nothing!!! (lowkey i did it this way because i wanted to know if i could (which i mean since javascript objects are taken by reference of course it works lol))
            print(mouse.y, OtherWindow.resizeHeight);
            if(mouse.y < OtherWindow.resizeHeight) {
                return HTTOP;
            }else {
                return HTCLIENT;
            }
        }else if(msg == WM_SIZE) {
            let wid = LOWORD(lp);
            let hei = HIWORD(lp);
            this.width = wid;
            this.height = hei;
            this.d2d.Resize(wid, hei); //hell yeah
        }
        else if(msg == WM_DESTROY) {
            print("quit? closed otherwnd");
            //SetWindowPos(hwnd, NULL, Math.random()*300, Math.random()*300, NULL, NULL, SWP_NOSIZE | SWP_NOZORDER);
            //return -1; //aw man i thought that i could stop DefWindowProc and it wouldn't close the window (but the only times i've ever "done" that was 3 years ago when i used SFML's events to move the window instead of calling RenderWindow::close())
            PostQuitMessage(0);
        }
        
        //print(msg, Int_To_WM(msg));//"rvents?");
        
        //if(this.hover != lastHover) {
        //    //print(this.hover);
        //    if(this.hover) {
        //        const rect = GetWindowRect(hwnd);
        //        //KillTimer(hwnd, 1); //i don't think anything bad happens if you call KillTimer without a valid timer id
        //        //this.hoverTimer = 0;
        //        TrackMouseEvent(TME_LEAVE, hwnd, NULL); //track mouse event only works when the mouse is over the window! (also: The application must call TrackMouseEvent when the mouse reenters its window if it requires further tracking of mouse hover behavior.)
        //        //print(TrackMouseEvent(TME_LEAVE | TME_QUERY, hwnd, NULL));
        //        SetWindowPos(hwnd, NULL, rect.left, rect.top+5, rect.right-rect.left, rect.bottom-rect.top+10, SWP_NOMOVE | SWP_NOZORDER);
        //    }else {
        //        //KillTimer(hwnd, 1); //i don't think anything bad happens if you call KillTimer without a valid timer id
        //        //this.hoverTimer = SetTimer(hwnd, 1, 200);
        //        //SetWindowPos(hwnd, NULL, rect.left, rect.top+5, rect.right-rect.left, rect.bottom-rect.top-10, SWP_NOMOVE | SWP_NOZORDER);
        //    }
        //}

        return DefWindowProc(hwnd, msg, wp, lp);
    }
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES
        //uxtheme = DllLoad("UxTheme.dll");
        //print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
        //print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
        //let result = uxtheme("SetWindowTheme", 3, [hwnd, NULL, NULL], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER); //NO FUCKING WAY?!
        //print(result, "result");
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(24, 24, 24)); //hell yeah this shit tuff asf (dark title bar)[doesn't work if you get rid of the window theme tho]
        
        otherwnd = new OtherWindow(hwnd); //blocks the thread per CreateWindow!
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        StretchDIBits(ps.hdc, 0, 0, w, h, 0, 0, w, h, drawing, w, h, 32, BI_RGB, SRCCOPY); //using stretchdibits because i didn't add SetDIBitsToDevice lol
        EndPaint(hwnd, ps);
    }else if(msg == WM_DROPFILES) { //according to this you can't drag and drop from a 32 bit app to a 64 bit one with WM_DROPFILES https://stackoverflow.com/questions/51204851/dragdrop-event-wm-dropfiles-in-c-gui
        //also yeah there's COM drag&drop stuff but idk if i can be bothered to do all that just yet 
        print(wp, lp); //wp is the HDROP parameter we're looking for 👀
        const pt = DragQueryPoint(wp);
        print(pt);
        const files = DragQueryFile(wp, -1); //oh hell yeah'
        print(files);
        const filenames = [];
        for(let i = 0; i < files; i++) {
            filenames[i] = DragQueryFile(wp, i);
        }

        print(filenames);

        DragFinish(wp); //DragFinish to HDROP is as DeleteDC is to memDC (analogymaxxing)
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0); //but it refused.
    }
}

const wc = CreateWindowClass("winclass", windowProc);
print(COLOR_BACKGROUND);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "shadereditor like renderdoc", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);
//print("sigma?");