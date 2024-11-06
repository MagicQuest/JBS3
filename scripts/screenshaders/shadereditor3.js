//ok im making shadereditor3.js because i had a brain blast and realized this would be better to make

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

//blur where white

let wic, d2d, font, colorBrush;
let gl;
let dirty = false;
let hitresult = 0;
let hitblueprint;
let activeButton;

const arrow = LoadCursor(NULL, IDC_ARROW);

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

//whachu fucking know about 

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
    vertex = undefined;
    fragment = undefined;
    
    constructor(name) {
        this.program = gl.createProgram();
        this.name = name;
    }
    /*constructor(vertexid, fragmentid, name) {
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
    }*/

    attachShader(shader, type) {
        if(type == gl.FRAGMENT_SHADER) {
            //this.fragmentid = shader;
            if(this.fragment) {
                print("fragment already filled (might quit;)");
            }
            this.fragment = shader;
        }else {
            if(this.vertex) {
                print("vertex already filled (might quit;)");
            }
            this.vertex = shader;
        }
        gl.attachShader(this.program, shader);
    }

    linkAndDetach() {
        gl.linkProgram(this.program);

        //const vertex = GLManager.shaders[this.vertexid];
        //const fragment = GLManager.shaders[this.fragmentid];

        gl.detachShader(this.program, this.vertex);
        gl.detachShader(this.program, this.fragment);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            const linkErrLog = gl.getProgramInfoLog(this.program);
            //cleanup();
            print(`Shader program ${this.name} did not link successfully. Error log: ${linkErrLog}`);
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
    static shaders = {fragment: [], vertex: []};

    static addShader(str, type) {
        const realshaderrttypefofnarr = type == gl.FRAGMENT_SHADER ? "fragment" : "vertex"; //yk what i mean
        GLManager.shaders[realshaderrttypefofnarr].push(loadshaderstring(str, type));
    }

    constructor() {

    }
}

//GLManager.programs.push({name: "fortnite", vertexid: 0, fragmentid: 1}, {name: "fortnite", vertexid: 0, fragmentid: 1}  );

function withinBounds({x, y, width, height}, pair) {
    return pair.x > x && pair.y > y && pair.x < x+width && pair.y < y+height;
}

const TOP = 0b00000001;
const LEFT = 0b00000010;
const RIGHT = 0b00000100;
const BOTTOM = 0b00001000;
const BUTTON  = 0b00010000;
const MOVE     = 0b00100000;
const CONTEXTMENU=0b01000000;
const DROP        =0b10000000;

const hittestarr = [
    [TOP, LoadCursor(NULL, IDC_SIZENS)],
    [LEFT, LoadCursor(NULL, IDC_SIZEWE)],
    [RIGHT, LoadCursor(NULL, IDC_SIZEWE)],
    [BOTTOM, LoadCursor(NULL, IDC_SIZENS)],
    [BUTTON, LoadCursor(NULL, IDC_HAND)],
    [MOVE, LoadCursor(NULL, IDC_SIZEALL)],
    [CONTEXTMENU, LoadCursor(NULL, IDC_HELP)],
    [DROP, LoadCursor(NULL, IDC_HAND)],
];

class Draggable { //not to be confused with Draggable from jbstudio3 (this shit is elegant as fuck)
    static lockX = false;
    static lockY = false;
    static dragging = false;
    static dragged = undefined;
    static offset = undefined;
    static defaultRelease = true;

    static select(object, mouse, lx, ly, releaseonmouseup = true) {
        Draggable.dragging = true;
        Draggable.dragged = object;
        Draggable.offset = {x: mouse.x - object.x, y: mouse.y - object.y};
        Draggable.lockX = lx;
        Draggable.lockY = ly;
        Draggable.defaultRelease = releaseonmouseup;
    }

    static update(mouse) {
        !Draggable.lockX && (Draggable.dragged.x = mouse.x-Draggable.offset.x);
        !Draggable.lockY && (Draggable.dragged.y = mouse.y-Draggable.offset.y);
        Draggable.dragged.onDrag?.();
        print(Draggable.dragged.x, Draggable.dragged.y, mouse.x, mouse.y, );
        dirty = true;
    }

    static release() {
        //Draggable.lockX = false;
        //Draggable.lockY = false;
        Draggable.dragging = false;
        Draggable.dragged = undefined;
        Draggable.offset = undefined;
    }

    static mouseUp() {
        if(Draggable.defaultRelease) {
            Draggable.release();
        }
    }
}

class Blueprint {
    static paramColors = {};
    //static captionHeight = GetSystemMetrics(SM_CYCAPTION) + GetSystemMetrics(SM_CYEDGE)*2; //27
    static captionHeight = 21;

    parent = NULL;
    title = "";
    x = 0;
    y = 0;
    width = 256;
    height = 100;
    parameters = [];
    out = [];

    gradientStops = [];
    gradients = [];

    static padding = 16;
    static radius = 4;

    static create(parent, title, x, y, width, height, parameters, out) {
        const b = new Blueprint(parent, title, x, y, width, height, parameters, out);
        blueprints.push(b);
        return b;
    }

    constructor(parent, title, x, y, width, height, parameters, out) {
        this.parent = parent;
        this.title = title;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.parameters = parameters;
        this.out = out;

        this.gradientStops.push(
            //d2d.CreateGradientStopCollection([0.0, 0.0, 67/255, 255/255], [0.8, 32/255, 32/255, 32/255]),
            d2d.CreateGradientStopCollection([0.0, 95/255, 150/255, 187/255], [0.8, 32/255, 32/255, 32/255]),
            d2d.CreateGradientStopCollection([0.0, 32/255, 32/255, 32/255], [0.4, 0.0, 0.0, 0.0, 0.0]),
            d2d.CreateGradientStopCollection([0.0, 27/255, 28/255, 27/255], [0.4, 19/255, 21/255, 19/255], [.8, 15/255, 17/255, 15/255]),
        );
        
        this.gradients.push(
            d2d.CreateLinearGradientBrush(0,0,this.width,this.height, this.gradientStops[0]),
            d2d.CreateRadialGradientBrush(this.width/3, Blueprint.captionHeight/2, 0, 0, this.width, Blueprint.captionHeight, this.gradientStops[1]),
            d2d.CreateLinearGradientBrush(0, Blueprint.captionHeight, this.width, this.height, this.gradientStops[2]),
        );

        for(let i = 0; i < this.parameters.length; i++) {
            const param = this.parameters[i];
            const gsc = d2d.CreateGradientStopCollection([0.0, ...Blueprint.paramColors[param]], [0.5, 0.0, 0.0, 0.0, 0.0]);
            this.gradientStops.push(gsc);
            this.gradients.push(d2d.CreateRadialGradientBrush(Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight, gsc));
        }

        for(let i = 0; i < this.out.length; i++) {
            const op = this.out[i];
            const gsc = d2d.CreateGradientStopCollection([0.0, ...Blueprint.paramColors[param]], [0.5, 0.0, 0.0, 0.0, 0.0]);
            this.gradientStops.push(gsc);
            this.gradients.push(d2d.CreateRadialGradientBrush(Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight, gsc));
        }
    }

    redraw() {
        d2d.FillRectangle(0, 0, this.width, Blueprint.captionHeight, this.gradients[0]);
        d2d.FillRectangle(0, 0, this.width, Blueprint.captionHeight, this.gradients[1]);
        colorBrush.SetColor(1.0, 1.0, 1.0);
        d2d.DrawText(this.title, font, 21, 0, this.width, Blueprint.captionHeight, colorBrush);
        d2d.FillRectangle(0, Blueprint.captionHeight, this.width, this.height, this.gradients[2]);
        for(let i = 0; i < this.parameters.length; i++) {
            const param = this.parameters[i];
            d2d.FillRectangle(Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 100, this.height, this.gradients[3+i]);
            colorBrush.SetColor(...Blueprint.paramColors[param]);
            d2d.DrawEllipse(Blueprint.padding-8, (i+1)*Blueprint.captionHeight+Blueprint.padding, Blueprint.radius, Blueprint.radius, colorBrush, 2);
            colorBrush.SetColor(1.0, 1.0, 1.0); 
            d2d.DrawText(param, font, Blueprint.padding, (i+1)*Blueprint.captionHeight + Blueprint.padding, this.width, this.height, colorBrush);
        }
    }

    windowResized(oldw, oldh) {
        //this.y *= h/oldh;
        //this.height *= h/oldh;
        //this.width *= w/oldw;
    }

    hittest(mouse) {
        if(mouse.y < Blueprint.captionHeight) {
            return [MOVE];
        }else {
            for(let i = 0; i < this.parameters.length; i++) {
                if(withinBounds({x: Blueprint.padding-8-Blueprint.radius-2, y: (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2, width: Blueprint.radius*2+2, height: Blueprint.radius*2+2}, mouse)) {
                    return [DROP, i];
                }
            }
            return [NULL];
        }
    }

    destroy() {
        for(let i = 0; i < this.gradientStops.length; i++) {
            this.gradientStops[i].Release();
            this.gradients[i].Release();
        }
        blueprints.splice(blueprints.indexOf(this), 1);
    }

    //onDrag() { //implements DraggableObject (if this were a stronger object oriented language)
    //    this.height = h-this.y;
    //}
}

let w = 800;
let h = 600;

const camera = {x: 0, y: 0, zoom: 1}; //idk if im gonna do zoom lowkey but just in case like a reserved parameter...

let blueprints = [];

function d2dpaint() {
    d2d.BeginDraw();
    //d2d.DrawBitmap(drawing, 0, 0, w, h);
    for(const blueprint of blueprints) {
        d2d.SaveDrawingState();
        d2d.SetTransform(Matrix3x2F.Translation(blueprint.x, blueprint.y));
        //defaultBGG.SetTransform(Matrix3x2F.Multiply(Matrix3x2F.Translation(blueprint.x, blueprint.y), Matrix3x2F.Scale(blueprint.width/100, blueprint.height/100, blueprint.x, blueprint.y)));
        //defaultBGG.SetTransform(Matrix3x2F.Scale(blueprint.width, blueprint.height, 0, 0));
        //d2d.FillRectangle(0, 0, blueprint.width, blueprint.height, defaultBGG);
        blueprint.redraw();
        d2d.RestoreDrawingState();
    }

    //defaultBGG.SetTransform(Matrix3x2F.Identity());
    d2d.EndDraw();
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        //defaultBGG = d2d.CreateLinearGradientBrush(0,0,1,1,d2d.CreateGradientStopCollection([1.0, 204/255, 204/255, 204/255], [0.0, 178/255, 212/255, 1.0]));
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);
        font = d2d.CreateFont(NULL, 12);
        //font.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);

        gl = createCanvas("gl", NULL, hwnd);
        Blueprint.paramColors["FRAGMENT_SHADER"] = [255/255, 42/255, 0.0];
        Blueprint.paramColors["VERTEX_SHADER"] = [136/255, 255/255, 0.0];
        //DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES
        //uxtheme = DllLoad("UxTheme.dll");
        //print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
        //print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
        //let result = uxtheme("SetWindowTheme", 3, [hwnd, NULL, NULL], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER); //NO FUCKING WAY?!
        //print(result, "result");
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(24, 24, 24)); //hell yeah this shit tuff asf (dark title bar)[doesn't work if you get rid of the window theme tho]
        
        //otherwnd = new BottomPane(hwnd); //no longer blocks the thread as i make and draw every control myself
        blueprints.push(new Blueprint(hwnd, "Program", 300, 100, 221, 90*2, ["FRAGMENT_SHADER", "VERTEX_SHADER"], []));
        blueprints.push(new Blueprint(hwnd, "Shader", 0, 100, 221, 90, [], ["SHADER"]));
        d2dpaint();
    }else if(msg == WM_PAINT) {   
        dirty = true;
        //const ps = BeginPaint(hwnd);
        //StretchDIBits(ps.hdc, 0, 0, w, h, 0, 0, w, h, drawing, w, h, 32, BI_RGB, SRCCOPY); //using stretchdibits because i didn't add SetDIBitsToDevice lol
        //EndPaint(hwnd, ps);
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

        if(filenames && filenames[0]) {
            //dragndropshaderpopup(hwnd).script = require("fs").read(filenames[0]);
        }

        dirty = true;

        DragFinish(wp); //DragFinish to HDROP is as DeleteDC is to memDC (analogymaxxing)
    }else if(msg == WM_SIZE) {
        let oldw = w;
        let oldh = h;
        let wid = LOWORD(lp);
        let hei = HIWORD(lp);
        w = wid;
        h = hei;
        d2d.Resize(wid, hei); //hell yeah
        for(const blueprint of blueprints) {
            blueprint.windowResized?.(oldw, oldh);
        }
        dirty = true;
    }/*else if(msg == WM_MOUSEMOVE) { //oops i thought mousemove was the best place to check and change the cursor BUT WM_SETCURSOR is actually made for this lmao
        //using SetCursor in here would cause flickering!
    }*/else if(msg == WM_SETCURSOR) { //https://stackoverflow.com/questions/19257237/reset-cursor-in-wm-setcursor-handler-properly
        //print("setcursornigga");
        const mouse = GetCursorPos();//{x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //i was originally using WM_MOUSEMOVE which passed the mouse position in the lp
        ScreenToClient(hwnd, mouse); //fun (returns nothing and modifies the object)
        //let result = 0;
        hitresult = 0;
        hitblueprint = undefined;
        for(const blueprint of blueprints) {
            if(withinBounds(blueprint, mouse)) {
                hitblueprint = undefined;

                const clientmouse = {x: mouse.x-blueprint.x, y: mouse.y-blueprint.y};
                //mouse.x -= blueprint.x;
                //mouse.y -= blueprint.y; //to client (oops i was directly modifying mouse)
                const [legit, data] = blueprint.hittest(clientmouse);
                //hitresult |= legit; //lowkey i was just OR ing them together to make it easier
                //if(legit != 0) {
                    hitresult = legit;
                    if(legit) {
                        hitblueprint = legit == BUTTON ? data : blueprint;
                    }
                //}
            }
        }
        for(const [flag, cursor] of hittestarr) {
            //if((hitresult & flag) == flag) {
            if(hitresult == flag) { //i had to change hitresult to be only one value because if the topmost blueprint set TOP and a blueprint below set MOVE, it would use MOVE because it was the last element of hittestarr (wait a second that's not even the current problem)
                SetCursor(cursor);
            }
        }
        if(hitresult) {
            dirty = true;
            //SetCursor(arrow);
            return 1; //return true from WM_SETCURSOR to halt further processing (AND MOST IMPORTANTLY, RETURNING A VALUE OTHER THAN 0 DOES NOT CALL DefWindowProc NO MATTWR WHAT!!!!!)
        }
    }else if(msg == WM_LBUTTONDOWN) {
        SetCapture(hwnd);
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos
        if(hitresult && hitblueprint) {
            //if((hitresult & BUTTON) == BUTTON) {
            if(hitresult == BUTTON) {
                hitblueprint.mouseDown(mouse);
                activeButton = hitblueprint;
            }else //if((hitresult & MOVE) == MOVE) {
            if(hitresult == MOVE) {
                Draggable.select(hitblueprint, mouse, false, false);
            }else if(hitresult == CONTEXTMENU || hitresult == DROP) {
                //no
            }else {
                //const updown = ((hitresult & TOP) == TOP) || ((hitresult & BOTTOM) == BOTTOM);
                const updown = hitresult == TOP || hitresult == BOTTOM;
                Draggable.select(hitblueprint, mouse, updown, !updown);
            }
        }

        for(const blueprint of blueprints) {
            if(blueprint.x <= mouse.x && blueprint.y <= mouse.y) {
                mouse.x -= blueprint.x;
                mouse.y -= blueprint.y; //to client
                //hitresult |= blueprint.hittest(mouse);
                blueprint.mouseDown?.(mouse);
            }
        }
    }else if(msg == WM_RBUTTONDOWN) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos

        if(hitresult == BUTTON) {
            hitblueprint.rightMouseDown?.(mouse);
        }else if(hitresult == CONTEXTMENU) {
            const screenmousepos = GetCursorPos();
            hitblueprint.preContextMenu(screenmousepos);
            TrackPopupMenu(hitblueprint.contextMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, screenmousepos.x, screenmousepos.y, hwnd);
        }

        for(const blueprint of blueprints) {
            if(blueprint.x <= mouse.x && blueprint.y <= mouse.y) {
                mouse.x -= blueprint.x;
                mouse.y -= blueprint.y; //to client
                //hitresult |= blueprint.hittest(mouse);
                blueprint.rightMouseDown?.(mouse);
            }
        }
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture();
        Draggable.mouseUp();

        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos
        //if(hitresult == BUTTON) {
        //    hitblueprint.mouseUp(mouse);
        //}
        if(activeButton) {
            activeButton.mouseUp?.(mouse);
            dirty = true;
        }
        activeButton = undefined;

        for(const blueprint of blueprints) {
            if(blueprint.x <= mouse.x && blueprint.y <= mouse.y) {
                mouse.x -= blueprint.x;
                mouse.y -= blueprint.y; //to client
                //hitresult |= blueprint.hittest(mouse);
                blueprint.mouseUp?.(mouse);
            }
        }
    }else if(msg == WM_COMMAND) {
        if(hitresult == CONTEXTMENU) { //mango
            hitblueprint.onCommand(wp, lp);
            dirty = true;
        }
    }else if(msg == WM_KEYDOWN) {
        if(wp == "E".charCodeAt(0)) {
            print("e");
            if(GetKey(VK_CONTROL)) {
                SetForegroundWindow(GetConsoleWindow());
                try {
                    print(eval(getline("Ctrl+E -> Eval some code: ")));
                }catch(e) {
                    print(e.toString());
                }
                SetForegroundWindow(hwnd);
            }
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0); //but it refused.
    }

    if(Draggable.dragging) {
        const mouse = GetCursorPos();
        ScreenToClient(hwnd, mouse);
        Draggable.update(mouse);
    }

    if(dirty) {
        print("DIRTY!!!", Int_To_WM(msg), Math.random());
        d2dpaint();
        dirty = false;
    }

    //for(const blueprint of blueprints) {
    //    if(blueprint.x <= mouse.x && blueprint.y <= mouse.y) {
    //        mouse.x -= blueprint.x;
    //        mouse.y -= blueprint.y; //to client
    //        //hitresult |= blueprint.hittest(mouse);
    //        blueprint.windowProc(hwnd, msg, wp, lp);
    //    }
    //}
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = arrow;//NULL; //LoadCursor(NULL, IDC_ARROW); //im using NULL here because im changing SetCursor myself here (nevermind i stopped using NULL because i handle the WM_SETCURSOR event and when i don't change the cursor i have DefWindowProc do the work)

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "shadereditor like unreal blueprints", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);
