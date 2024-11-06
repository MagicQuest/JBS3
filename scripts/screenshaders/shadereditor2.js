//lowkey i've already written and changed so much about shadereditor.js that i need to makei t again
//oh yeah i guess another reason why is because OtherWindow (now BottomPane) was an actual window (that blocked the thread and confused js to the point where it wouldn't stop running when you closed the window)

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

let w = 800;
let h = 600;
let wic, d2d, defaultBGG, font, colorBrush;
let gl;
let dirty = false;
let hitresult = 0;
let hitpane;
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

//const Int_To_WM = closure();


//whachu fucking know about 

function loadwicawndfuggetaboutit() {
    wic = InitializeWIC(); ScopeGUIDs(wic);
    const bitmp = wic.LoadBitmapFromFilename(__dirname+"/shadereditor.png", wic.GUID_WICPixelFormat32bppPBGRA, 0);
    return d2d.CreateBitmapFromWicBitmap(bitmp, true);
    //const bits = bitmp.GetPixels(wic);
    //bitmp.Release();
    //wic.Release();
//
    //return bits;
}

let drawing;

//const drawing = loadwicawndfuggetaboutit();

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

const TOP = 0b0000001;
const LEFT = 0b0000010;
const RIGHT = 0b0000100;
const BOTTOM = 0b0001000;
const BUTTON  = 0b0010000;
const MOVE     = 0b0100000;
const CONTEXTMENU=0b1000000;

const hittestarr = [
    [TOP, LoadCursor(NULL, IDC_SIZENS)],
    [LEFT, LoadCursor(NULL, IDC_SIZEWE)],
    [RIGHT, LoadCursor(NULL, IDC_SIZEWE)],
    [BOTTOM, LoadCursor(NULL, IDC_SIZENS)],
    [BUTTON, LoadCursor(NULL, IDC_HAND)],
    [MOVE, LoadCursor(NULL, IDC_SIZEALL)],
    [CONTEXTMENU, LoadCursor(NULL, IDC_HELP)],
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

class DialogPane { //this is bout to look like java's generic popups
    static captionHeight = GetSystemMetrics(SM_CYCAPTION) + GetSystemMetrics(SM_CYEDGE)*2; //27
    //static blackBrush; //defined in WM_CREATE (when i create d2d) (wait nevermind i'll just make BottomPane's colorBrush a globalvalue)
    controls = [];
    x = 0;
    y = 0;
    width = 256;
    height = 100;

    static create(parent, title, x, y, width, height) {
        let d = new DialogPane(parent, title, x, y, width, height);
        //dialogs.push(d);
        panes.push(d);
        return d;
    }

    constructor(parent, title, x, y, width, height) {
        this.parent = parent;
        this.title = title;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    addDropdown(text, x, y, args) {
        const dropdownheight = font.GetFontSize()+6;
        const longeststr = args.toSorted((a, b) => b.length-a.length)[0].length; //toSorted because args.sort modifies the array dirrectly (in-place whawtevert according to MDN)
        const control = {parent: this, text, x, y: y+DialogPane.captionHeight, width: (text.length*(font.GetFontSize()))+(longeststr*(font.GetFontSize()/2))+font.GetFontSize(), height: dropdownheight, type: "DROPDOWN", args, mouseDown: function(mouse) {
            //oh lowkey mouse is not in the client of this pane when sent through mouseDown
            mouse = {x: mouse.x-this.parent.x, y: mouse.y-this.parent.y};
            this.pushed = !this.pushed;
            if(this.pushed) {
                this.height = (args.length+1)*dropdownheight;
            }else {
                this.height = dropdownheight;
                const textwidth = control.text.length*(font.GetFontSize()/2);
                let j = 0 ;
                for(let i = 0; i < this.args.length; i++) {
                    if(withinBounds({x: this.x+textwidth, y: this.y+dropdownheight*(i+1), width: this.width, height: dropdownheight}, mouse)) {
                        j = i;
                    }
                }
                this.selected = j;
            }
        }, selected: 0};

        this.controls.push(control);
        return this;
    }

    addButton(text, x, y, width, height, callback) {
        const control = {parent: this, text, x, y: y+DialogPane.captionHeight, width, height, type: "BUTTON", mouseDown: function() { //lowkey when you start to add functions accessing "this" on an object it's time to make a class lmaop
            this.pushed = true;
            callback.call(this);
        }, mouseUp: function() {
            this.pushed = false;
            //print("mouseu p");
        }, pushed: false};
        
        const dc = GetDC(this.parent);
        const temp = CreateBitmap(width, height, 32, NULL);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, temp);
        DrawFrameControl(memDC, 0, 0, width, height, DFC_BUTTON, DFCS_BUTTONPUSH);
        control.DEFAULT = d2d.CreateBitmapFromWicBitmap(wic.CreateBitmapFromHBITMAP(temp, NULL, WICBitmapIgnoreAlpha, wic.GUID_WICPixelFormat32bppPBGRA), true);
        DrawFrameControl(memDC, 0, 0, width, height, DFC_BUTTON, DFCS_BUTTONPUSH | DFCS_PUSHED);
        control.LBUTTONDOWN = d2d.CreateBitmapFromWicBitmap(wic.CreateBitmapFromHBITMAP(temp, NULL, WICBitmapIgnoreAlpha, wic.GUID_WICPixelFormat32bppPBGRA), true);
        DeleteDC(memDC);
        DeleteObject(temp);
        ReleaseDC(this.parent, dc);
        
        this.controls.push(control);
        return this; //function chaining GRAHHHHH
    }

    destroy() {
        for(const control of this.controls) {
            control.DEFAULT?.Release();
            control.LBUTTONDOWN?.Release();
        }
        panes.splice(panes.indexOf(this), 1);
    }

    redraw() {
        colorBrush.SetColor(64/255, 64/255, 64/255);
        d2d.DrawRectangle(0, 0, this.width, this.height, colorBrush);
        colorBrush.SetColor(24/255, 24/255, 24/255);
        d2d.FillRectangle(0, 0, this.width, DialogPane.captionHeight, colorBrush);
        colorBrush.SetColor(1.0, 1.0, 1.0);
        d2d.DrawText(this.title, font, 0, (DialogPane.captionHeight/2 - font.GetFontSize()/1.5), this.width, DialogPane.captionHeight, colorBrush);

        for(const control of this.controls) {
            if(control.type == "BUTTON") {
                //colorBrush.SetColor(200/255, 200/255, 200/255);
                //d2d.FillRectangle(control.x, control.y, control.x+control.width, control.y+control.height, colorBrush);
                if(control.pushed) {
                    d2d.DrawBitmap(control.LBUTTONDOWN, control.x, control.y, control.x+control.width, control.y+control.height, 1.0);
                }else {
                    d2d.DrawBitmap(control.DEFAULT, control.x, control.y, control.x+control.width, control.y+control.height, 1.0);
                }
                colorBrush.SetColor(0.0, 0.0, 0.0);
                //d2d.FillEllipse(control.x+10, control.y+(control.height/2 - font.GetFontSize()/1.5), 5, 5, colorBrush);
                //d2d.DrawText(control.text, font, control.x, control.y+(control.height/2 - font.GetFontSize()/1.5), control.x+control.width, control.y+control.height, colorBrush);
                d2d.DrawText(control.text, font, control.x, control.y+(control.height/2 - font.GetFontSize()/1.5), control.x+control.width, control.y+control.height, colorBrush);
            }else if(control.type == "DROPDOWN") {
                colorBrush.SetColor(0.0, 0.0, 0.0);
                const textwidth = control.text.length*(font.GetFontSize()/2);
                d2d.DrawText(control.text, font, control.x, control.y, control.x+textwidth, control.y+font.GetFontSize(), colorBrush);

                //d2d.FillRectangle(0, control.y, control.text.length*(font.GetFontSize()/2), control.y+control.height, colorBrush);
                d2d.DrawRectangle(control.x+textwidth, control.y, control.x+control.width, control.y+control.height, colorBrush);
                colorBrush.SetColor(1.0, 1.0, 1.0);
                d2d.FillRectangle(control.x+textwidth, control.y, control.x+control.width, control.y+control.height, colorBrush);
                colorBrush.SetColor(0.0, 0.0, 0.0);
                d2d.DrawText(control.args[control.selected], font, control.x+textwidth, control.y, control.x+control.width, control.y+control.height, colorBrush);
                
                if(control.pushed) {
                    const dropdownheight = control.height/(control.args.length+1); //lol
                    for(let i = 0; i < control.args.length; i++) {
                        colorBrush.SetColor(0.0, 0.0, 0.0);
                        d2d.DrawRectangle(control.x+textwidth, control.y+(i+1)*dropdownheight, control.x+control.width, (control.y+(i+1)*dropdownheight)+dropdownheight, colorBrush);
                        colorBrush.SetColor(1.0, 1.0, 1.0);
                        d2d.FillRectangle(control.x+textwidth, control.y+(i+1)*dropdownheight, control.x+control.width, (control.y+(i+1)*dropdownheight)+dropdownheight, colorBrush);
                        colorBrush.SetColor(0.0, 0.0, 0.0);
                        d2d.DrawText(control.args[i], font, control.x+textwidth, control.y+(i+1)*dropdownheight, control.x+control.width, (control.y+(i+1)*dropdownheight)+dropdownheight, colorBrush);
                    }
                }/*else {

                }*/
            }
        }
    }

    hittest(mouse) {
        if(mouse.y < DialogPane.captionHeight) {
            return [MOVE];
        }else {
            for(const control of this.controls) {
                if(withinBounds(control, mouse)) {
                    return [BUTTON, control];
                }
            }
            return [NULL];
        }
    }
}

class BottomPane { //https://www.youtube.com/watch?v=24Eh2-DZTgQ
    static resizeHeight = 10;
    handleGradientBrush = undefined;
    windowGradientBrush = undefined;
    clearBrush = undefined;
    //colorBrush = undefined;
    //font = undefined;
    width = w;
    height = h-325;
    x = 0;
    y = 325;
    activeProgram = 0;
    contextMenu = CreatePopupMenu();
    vertexmenu = undefined;
    fragmentmenu = undefined;
    static ID_RENAME = 1;
    static ID_LINK = 2;
    static ID_VERTEX = 10;
    static ID_FRAGMENT = 100;

    //static gradientRectVertices = [ //for when i used GDI in WM_PAINT
    //    [0, 0, ...GDI.toCOLOR16s(0, 255, 0), 0], //im using (0, 0) here and (1, resizeHeight) as the upper-left and bottom-right so i can transform these hoes later (with SaveDC)
    //    [1, BottomPane.resizeHeight, ...GDI.toCOLOR16s(0, 0, 255), 0],
    //];
    //static gRect = [
        //    [0, 1], //indexes of the upper-left and bottom-right vertices (of gradientRectVertices)
        //];
        
    constructor(hwnd) {
        this.parent = hwnd;
        //let otherwc = CreateWindowClass("otherw", this.windowProc.bind(this)); //OOPS i didn't bind this and my variables were global?! (i was gonna make em static but it looked ugly lmao)
        //otherwc.hbrBackground = COLOR_BACKGROUND;
        //otherwc.hCursor = LoadCursor(NULL, IDC_HAND);
        //otherwc.DefWindowProc = false;
        ////otherwc.style = CS_HREDRAW | CS_VREDRAW; //oops this was causing flickering
        //CreateWindow(NULL, otherwc, NULL, (WS_SIZEBOX | WS_CHILD | WS_VISIBLE) ^ (WS_BORDER | WS_THICKFRAME), 0, 325, w, h-325, hwnd, NULL, hInstance); //why can'yt you do WS_POPUP with WS_CHILD
        ////print("closed otherwnd");
        
        this.clearBrush = d2d.CreateSolidColorBrush(200/255, 200/255, 200/255);
        //this.colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);
        this.windowGradientBrush = d2d.CreateLinearGradientBrush(0,0,100,100,d2d.CreateGradientStopCollection([0.0, 204/255, 204/255, 204/255], [0.5, 178/255, 212/255, 167/255], [1.0, 178/255, 212/255, 1.0]));
        this.handleGradientBrush = d2d.CreateLinearGradientBrush(0, 0, 0, BottomPane.resizeHeight, d2d.CreateGradientStopCollection([0.0, 0.0, 1.0, 0.0], [1.0, 0.0, 0.0, 1.0])); //ohhhhh the direction of the gradient is based on the upper-left and bottom-right coordinate you put
        //this.handleGradientBrush.SetTransform(Matrix3x2F.Rotation(Math.PI/2, 0, 0));
        //this.font = d2d.CreateFont(NULL, 12);
        
        this.windowGradientBrush.SetTransform(Matrix3x2F.Scale(2.31, 2.31, 0, 0));
        
        //this.redraw();
        InsertMenu(this.contextMenu, 0, MF_BYPOSITION | MF_STRING, BottomPane.ID_RENAME, "Rename");
        InsertMenu(this.contextMenu, 3, MF_BYPOSITION | MF_STRING, BottomPane.ID_LINK, "Link!");
    }
        
    //static ToClient(func, left, top, right, bottom) { //nah nah fuck all that (im in a weird headspace because of decorators. I was stuck in js world when d2d can TRANSFORM to client!!)
    //    return func(this.x+left, this.y+top, this.x+right, this.y+bottom); //how fun!
    //}

    static padding = 22;
    newButton = {x: 0, y: 0, radius: BottomPane.padding+8,
        mouseDown: function(mouse) {
            print("new program!");
            GLManager.programs.push(new Program(mouse));
        }
    };

    redraw() {
        //this.d2d.BeginDraw();
        //this.d2d.Clear(200/255, 200/255, 200/255); //COLOR_BACKGROUND (MAYBE) is 0xC8C8C8 (200, 200, 200) but for some reason when i use GetSysColor AND check the registry (Computer\HKEY_CURRENT_USER\Control Panel\Colors) it's 0
        //this.handleGradientBrush.SetTransform(Matrix3x2F.Rotation(this.k, w/2, BottomPane.resizeHeight/2));
        
        //nah but how cool would it be to just
        //@ToClient
        //d2d.FillRectangle(0, 0, this.width, this.height, this.clearBrush);
        //d2d.FillRectangle(0, 0, this.width, this.height, defaultBGG); //d2dpaint draws the defaultBBG before this redraw is called
        d2d.FillRectangle(0, 0, w, BottomPane.resizeHeight, this.handleGradientBrush);
        //BottomPane.ToClient(d2d.FillRectangle, 0, 0, this.width, this.height, this.clearBrush);
        //BottomPane.ToClient(d2d.FillRectangle, 0, 0, w, BottomPane.resizeHeight, this.handleGradientBrush);
        
        const squareheightcalc = this.height-(BottomPane.padding*2);
        const toppadding = 16; //additional
        for(let i = 0; i < GLManager.programs.length; i++) {
            const p = GLManager.programs[i];
            //this.d2d.SaveDrawingState();
            //this.windowGradientBrush.SetTransform();
            //this.d2d.RestoreDrawingState();
            colorBrush.SetColor(0.0, 0.0, 0.0);

            //const BottomPane.padding = 22;
            const x = BottomPane.padding + (BottomPane.padding+squareheightcalc)*i;
            const y = BottomPane.padding;

            this.windowGradientBrush.SetTransform(Matrix3x2F.Multiply(Matrix3x2F.Translation(x, y), Matrix3x2F.Scale(squareheightcalc/100, squareheightcalc/100, x, y)));

            d2d.DrawRectangle(x, y, x+squareheightcalc, y+squareheightcalc, colorBrush);
            d2d.FillRectangle(x, y, x+squareheightcalc, y+squareheightcalc, this.windowGradientBrush);
            d2d.DrawText(`Program ${p.name} #${i}`, font, x/*+(text.length*(font.GetFontSize()/2))/2*/, y, x+squareheightcalc, y+squareheightcalc, colorBrush);

            let addpadding = toppadding;
            //for(let j = 0; j < 3; j++) {
            let j = 0;
                if(p.vertex) {
                    d2d.DrawRectangle(x+BottomPane.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, colorBrush);
                    d2d.FillRectangle(x+BottomPane.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, this.windowGradientBrush);
                    d2d.DrawText(`Vertex shader #${p.vertex}`, font, x+BottomPane.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, colorBrush);
                    
                    j++;
                    addpadding += toppadding;
                }

                if(p.fragment) {
                    d2d.DrawRectangle(x+BottomPane.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, colorBrush);
                    d2d.FillRectangle(x+BottomPane.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, this.windowGradientBrush);
                    d2d.DrawText(`Fragment shader #${p.fragment}`, font, x+BottomPane.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, colorBrush);

                    j++;
                    addpadding += toppadding;
                }

                d2d.DrawRectangle(x+BottomPane.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, colorBrush);
                d2d.FillRectangle(x+BottomPane.padding-14+(j*8), y+addpadding, x+squareheightcalc-8-(j*8), y+squareheightcalc-addpadding, this.windowGradientBrush);
            //}
        }
        //const radius = BottomPane.padding+8;
        
        //const xforplus = this.newButton.radius + (this.newButton.radius+squareheightcalc)*GLManager.programs.length;
        this.newButton.x = this.newButton.radius + (this.newButton.radius+squareheightcalc)*GLManager.programs.length;
        this.newButton.y = this.height/2;

        colorBrush.SetColor(0.0, 0.0, 0.0, 0.2);
        d2d.FillEllipse(this.newButton.x, this.newButton.y, this.newButton.radius, this.newButton.radius, colorBrush);
        colorBrush.SetColor(.2, .2, .2, 1.0);
        d2d.FillRectangle(this.newButton.x-(this.newButton.radius/6), this.newButton.y-this.newButton.radius/1.5, this.newButton.x+(this.newButton.radius/6), this.newButton.y+this.newButton.radius/1.5, colorBrush);
        d2d.FillRectangle(this.newButton.x-(this.newButton.radius/1.5), this.newButton.y-(this.newButton.radius/6), this.newButton.x+this.newButton.radius/1.5, this.newButton.y+(this.newButton.radius/6), colorBrush);
        
        //this.d2d.EndDraw();
    }

    windowResized(oldw, oldh) {
        this.y *= h/oldh;
        this.height *= h/oldh;
        this.width *= w/oldw;
    }

    mouseDown(mouse) {
        //newButton has a mouseDown function now
        //if(mouse.x > this.newButton.x-this.newButton.radius && mouse.y > this.newButton.y-this.newButton.radius && mouse.x < this.newButton.x+this.newButton.radius && mouse.y < this.newButton.y+this.newButton.radius) {
        //    print("new program!");
        //}
    }

    preContextMenu(mouse) {
        let p;
        const squareheightcalc = this.height-(BottomPane.padding*2);
        for(let i = 0; i < GLManager.programs.length; i++) {
            p = GLManager.programs[i];

            const x = BottomPane.padding + (BottomPane.padding+squareheightcalc)*i;
            const y = BottomPane.padding;

            if(withinBounds({x, y, width: squareheightcalc, height: squareheightcalc}, mouse)) {
                //return [CONTEXTMENU];
                break;
            }
        }
        this.activeProgram = p;

        if(this.vertexmenu) {
            DeleteMenu(this.contextMenu, 1, MF_BYPOSITION);
        }
        this.vertexmenu = CreateMenu();
        if(this.fragmentmenu) {
            DeleteMenu(this.contextMenu, 1, MF_BYPOSITION);
        }
        this.fragmentmenu = CreateMenu();
        for(let i = 0; i < GLManager.shaders.vertex.length; i++) {
            InsertMenu(this.vertexmenu, i, MF_BYPOSITION | MF_STRING, i+10, `Vertex shader #${i}`);
        }
        for(let i = 0; i < GLManager.shaders.fragment.length; i++) {
            InsertMenu(this.fragmentmenu, i, MF_BYPOSITION | MF_STRING, i+100, `Fragment shader #${i}`);
        }
        InsertMenu(this.contextMenu, 1, MF_BYPOSITION | MF_POPUP, this.vertexmenu, "Set vertex shader");
        InsertMenu(this.contextMenu, 2, MF_BYPOSITION | MF_POPUP, this.fragmentmenu, "Set fragment shader");
    }

    onCommand(wp, lp) {
        print(wp, lp);
        if(wp == BottomPane.ID_RENAME) {
            //make dialog
            print("make rename dialog...");
        }else if(wp == BottomPane.ID_LINK) {
            //https://www.youtube.com/watch?v=DXuOAWnuMVY
            this.activeProgram.linkAndDetach();
        }else if(wp >= BottomPane.ID_FRAGMENT) {
            this.activeProgram.attachShader(GLManager.shaders.fragment[wp-BottomPane.ID_FRAGMENT], gl.FRAGMENT_SHADER);
        }else if(wp >= BottomPane.ID_VERTEX) {
            this.activeProgram.attachShader(GLManager.shaders.vertex[wp-BottomPane.ID_VERTEX], gl.VERTEX_SHADER);
        }
    }

    hittest(mouse) {
        if(mouse.y < BottomPane.resizeHeight) {
            return [TOP];
        }else if(mouse.x > this.newButton.x-this.newButton.radius && mouse.y > this.newButton.y-this.newButton.radius && mouse.x < this.newButton.x+this.newButton.radius && mouse.y < this.newButton.y+this.newButton.radius) {
            return [BUTTON, this.newButton];
        }else {
            const squareheightcalc = this.height-(BottomPane.padding*2);
            for(let i = 0; i < GLManager.programs.length; i++) {
                //const p = GLManager.programs[i];
    
                const x = BottomPane.padding + (BottomPane.padding+squareheightcalc)*i;
                const y = BottomPane.padding;

                if(withinBounds({x, y, width: squareheightcalc, height: squareheightcalc}, mouse)) {
                    return [CONTEXTMENU];
                }
            }

            return [NULL];
        }
    }

    onDrag() { //implements DraggableObject (if this were a stronger object oriented language)
        this.height = h-this.y;
    }
    
    //windowProc(hwnd, msg, wp, lp) {
    //    
    //}
}

let panes = [];
//let dialogs = [];

function dragndropshaderpopup(hwnd) {
    const dlg = DialogPane.create(hwnd, "Add shader as a...", w/2 - 192/2, h/2 - 144/2, 192, 144).addButton("Ok!", 96-50, 144-DialogPane.captionHeight-33-8, 100, 33, function() {
        //print("those who know: ");
        //const dlg = this.parent; //is now valid!
        GLManager.addShader(dlg.script, gl[dlg.controls[1].args[dlg.controls[1].selected]]);
        //loadshaderstring(offthemenu.script, ); //lowkey hard coding a lot of this but it's not that bad
        dlg.destroy();
    }).addDropdown("gl.", 16, 16, ["FRAGMENT_SHADER", "VERTEX_SHADER"]);//["it's", "steaming", "momma"]);
    return dlg;
}

function d2dpaint() {
    d2d.BeginDraw();
    d2d.DrawBitmap(drawing, 0, 0, w, h);
    for(const pane of panes) {
        d2d.SaveDrawingState();
        d2d.SetTransform(Matrix3x2F.Translation(pane.x, pane.y));
        //defaultBGG.SetTransform(Matrix3x2F.Multiply(Matrix3x2F.Translation(pane.x, pane.y), Matrix3x2F.Scale(pane.width/100, pane.height/100, pane.x, pane.y)));
        defaultBGG.SetTransform(Matrix3x2F.Scale(pane.width, pane.height, 0, 0));
        d2d.FillRectangle(0, 0, pane.width, pane.height, defaultBGG);
        pane.redraw();
        d2d.RestoreDrawingState();
    }
    /*for(const dialog of dialogs) {
        d2d.SaveDrawingState();
        d2d.SetTransform(Matrix3x2F.Translation(dialog.x, dialog.y));

        defaultBGG.SetTransform(Matrix3x2F.Scale(dialog.width, dialog.height, 0, 0));
        d2d.FillRectangle(0, 0, dialog.width, dialog.height, defaultBGG);
        dialog.redraw();
        d2d.RestoreDrawingState();
    }*/
    defaultBGG.SetTransform(Matrix3x2F.Identity());
    d2d.EndDraw();
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        defaultBGG = d2d.CreateLinearGradientBrush(0,0,1,1,d2d.CreateGradientStopCollection([1.0, 204/255, 204/255, 204/255], [0.0, 178/255, 212/255, 1.0]));
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);
        drawing = loadwicawndfuggetaboutit();
        font = d2d.CreateFont(NULL, 12);
        font.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);

        gl = createCanvas("gl", NULL, hwnd);
        //DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES
        //uxtheme = DllLoad("UxTheme.dll");
        //print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
        //print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
        //let result = uxtheme("SetWindowTheme", 3, [hwnd, NULL, NULL], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER); //NO FUCKING WAY?!
        //print(result, "result");
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(24, 24, 24)); //hell yeah this shit tuff asf (dark title bar)[doesn't work if you get rid of the window theme tho]
        
        //otherwnd = new BottomPane(hwnd); //no longer blocks the thread as i make and draw every control myself
        panes.push(new BottomPane(hwnd));
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
            dragndropshaderpopup(hwnd).script = require("fs").read(filenames[0]);
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
        for(const pane of panes) {
            pane.windowResized?.(oldw, oldh);
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
        hitpane = undefined;
        for(const pane of panes) {
            if(withinBounds(pane, mouse)) {
                hitpane = undefined;

                const clientmouse = {x: mouse.x-pane.x, y: mouse.y-pane.y};
                //mouse.x -= pane.x;
                //mouse.y -= pane.y; //to client (oops i was directly modifying mouse)
                const [legit, data] = pane.hittest(clientmouse);
                //hitresult |= legit; //lowkey i was just OR ing them together to make it easier
                //if(legit != 0) {
                    hitresult = legit;
                    if(legit) {
                        hitpane = legit == BUTTON ? data : pane;
                    }
                //}
            }
        }
        for(const [flag, cursor] of hittestarr) {
            //if((hitresult & flag) == flag) {
            if(hitresult == flag) { //i had to change hitresult to be only one value because if the topmost pane set TOP and a pane below set MOVE, it would use MOVE because it was the last element of hittestarr (wait a second that's not even the current problem)
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
        if(hitresult && hitpane) {
            //if((hitresult & BUTTON) == BUTTON) {
            if(hitresult == BUTTON) {
                hitpane.mouseDown(mouse);
                activeButton = hitpane;
            }else //if((hitresult & MOVE) == MOVE) {
            if(hitresult == MOVE) {
                Draggable.select(hitpane, mouse, false, false);
            }else if(hitresult == CONTEXTMENU) {
                //no
            }else {
                //const updown = ((hitresult & TOP) == TOP) || ((hitresult & BOTTOM) == BOTTOM);
                const updown = hitresult == TOP || hitresult == BOTTOM;
                Draggable.select(hitpane, mouse, updown, !updown);
            }
        }

        for(const pane of panes) {
            if(pane.x <= mouse.x && pane.y <= mouse.y) {
                mouse.x -= pane.x;
                mouse.y -= pane.y; //to client
                //hitresult |= pane.hittest(mouse);
                pane.mouseDown?.(mouse);
            }
        }
    }else if(msg == WM_RBUTTONDOWN) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos

        if(hitresult == BUTTON) {
            hitpane.rightMouseDown?.(mouse);
        }else if(hitresult == CONTEXTMENU) {
            const screenmousepos = GetCursorPos();
            hitpane.preContextMenu(screenmousepos);
            TrackPopupMenu(hitpane.contextMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, screenmousepos.x, screenmousepos.y, hwnd);
        }

        for(const pane of panes) {
            if(pane.x <= mouse.x && pane.y <= mouse.y) {
                mouse.x -= pane.x;
                mouse.y -= pane.y; //to client
                //hitresult |= pane.hittest(mouse);
                pane.rightMouseDown?.(mouse);
            }
        }
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture();
        Draggable.mouseUp();

        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos
        //if(hitresult == BUTTON) {
        //    hitpane.mouseUp(mouse);
        //}
        if(activeButton) {
            activeButton.mouseUp?.(mouse);
            dirty = true;
        }
        activeButton = undefined;

        for(const pane of panes) {
            if(pane.x <= mouse.x && pane.y <= mouse.y) {
                mouse.x -= pane.x;
                mouse.y -= pane.y; //to client
                //hitresult |= pane.hittest(mouse);
                pane.mouseUp?.(mouse);
            }
        }
    }else if(msg == WM_COMMAND) {
        if(hitresult == CONTEXTMENU) { //mango
            hitpane.onCommand(wp, lp);
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

    //for(const pane of panes) {
    //    if(pane.x <= mouse.x && pane.y <= mouse.y) {
    //        mouse.x -= pane.x;
    //        mouse.y -= pane.y; //to client
    //        //hitresult |= pane.hittest(mouse);
    //        pane.windowProc(hwnd, msg, wp, lp);
    //    }
    //}
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = arrow;//NULL; //LoadCursor(NULL, IDC_ARROW); //im using NULL here because im changing SetCursor myself here (nevermind i stopped using NULL because i handle the WM_SETCURSOR event and when i don't change the cursor i have DefWindowProc do the work)

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "shadereditor like renderdoc", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);
//print("sigma?");