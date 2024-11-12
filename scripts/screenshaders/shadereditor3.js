//ok im making shadereditor3.js because i had a brain blast and realized this would be better to make
//oh yeah i should lowkey do this kinda thing for EVERY function in jbs just like unreal blueprints (and then i want to make a visual scripting discord bot thing!)

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
let hit = {};
let hitblueprint;
let activeButton;
let activePin;
let draws = 0;

const arrow = LoadCursor(NULL, IDC_ARROW);
const hand = LoadCursor(NULL, IDC_HAND);

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

const TOP = 0b000000001;
const LEFT = 0b000000010;
const RIGHT = 0b000000100;
const BOTTOM = 0b000001000;
const BUTTON  = 0b000010000;
const MOVE     = 0b000100000;
const CONTEXTMENU=0b001000000;
const DROP        =0b010000000;
const DRAG         =0b100000000;

const hittestarr = [
    [TOP, LoadCursor(NULL, IDC_SIZENS)],
    [LEFT, LoadCursor(NULL, IDC_SIZEWE)],
    [RIGHT, LoadCursor(NULL, IDC_SIZEWE)],
    [BOTTOM, LoadCursor(NULL, IDC_SIZENS)],
    [BUTTON, hand],
    [MOVE, LoadCursor(NULL, IDC_SIZEALL)],
    [CONTEXTMENU, LoadCursor(NULL, IDC_HELP)],
    [DROP, hand],
    [DRAG, hand],
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
    paramText = [];
    outText = [];

    connections = {in: [], out: []};

    static padding = 16;
    static radius = 4;

    static create(parent, title, color, x, y, width, height, parameters, out, pure) {
        const b = new Blueprint(parent, color, title, x, y, width, height, parameters, out, pure);
        blueprints.push(b);
        return b;
    }

    constructor(parent, title, color, x, y, width, height, parameters, out, pure) {
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
            d2d.CreateGradientStopCollection([0.0, ...color], [0.85, 32/255, 32/255, 32/255]),
            d2d.CreateGradientStopCollection([0.0, 32/255, 32/255, 32/255], [0.4, 0.0, 0.0, 0.0, 0.0]),
            d2d.CreateGradientStopCollection([0.0, 27/255, 28/255, 27/255], [0.4, 19/255, 21/255, 19/255], [.8, 15/255, 17/255, 15/255]),
            d2d.CreateGradientStopCollection([0.0, ...color], [0.2, 0.0, 0.0, 0.0, 0.0]),
        );
        
        this.gradients.push( //https://learn.microsoft.com/en-us/windows/win32/api/d2d1/ns-d2d1-d2d1_linear_gradient_brush_properties
            d2d.CreateLinearGradientBrush(0,0,this.width,/*this.height*/ Blueprint.captionHeight, this.gradientStops[0]),
            d2d.CreateRadialGradientBrush(this.width/3, Blueprint.captionHeight/2, 0, 0, this.width, Blueprint.captionHeight, this.gradientStops[1]),
            d2d.CreateLinearGradientBrush(0, Blueprint.captionHeight, this.width, this.height, this.gradientStops[2]),
            d2d.CreateLinearGradientBrush(2, 2, 2, Blueprint.captionHeight-2, this.gradientStops[3]), //pointing down
        );

        for(let i = 0; i < this.parameters.length; i++) {
            const [_, name, param] = this.parameters[i].match(/(.+) *: *(.+)/);
            //print(_, name, param, Blueprint.paramColors[param]);
            this.parameters[i] = param; //i don't need the variable name anymore because i store it in the text layout paramText[i]
            const gsc = d2d.CreateGradientStopCollection([0.0, ...Blueprint.paramColors[param]], [0.5, 0.0, 0.0, 0.0, 0.0]);
            this.paramText.push(d2d.CreateTextLayout(name, font, w, h));
            this.gradientStops.push(gsc);
            this.gradients.push(d2d.CreateRadialGradientBrush(Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight, gsc));
        }

        for(let i = 0; i < this.out.length; i++) {
            const op = this.out[i];
            const gsc = d2d.CreateGradientStopCollection([0.0, ...Blueprint.paramColors[op]], [0.5, 0.0, 0.0, 0.0, 0.0]);
            this.outText.push(d2d.CreateTextLayout(op, font, w, h));
            this.gradientStops.push(gsc);
            this.gradients.push(d2d.CreateRadialGradientBrush(Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight, gsc));
        }
    }

    getXAlong(connection, t) {
        return (connection.x-this.x-this.width-8)*t;
    }

    getYAlong(connection, y, t) {
        return (connection.y-this.y-y)*t;
    }

    redraw() { //wait i could lowkey draw basically all of these into a bitmap and draw that instead (efficiency) i was thinking about using a CommandList too //https://learn.microsoft.com/en-us/windows/win32/direct2d/improving-direct2d-performance
        //https://learn.microsoft.com/en-us/windows/win32/direct2d/printing-and-command-lists
        //https://github.com/MicrosoftDocs/win32/blob/docs/desktop-src/direct3d12/d2d-using-d3d11on12.md
        d2d.FillRoundedRectangle(0, Blueprint.captionHeight-4, this.width, this.height, 4, 4, this.gradients[2]);

        d2d.FillRoundedRectangle(0, 0, this.width, Blueprint.captionHeight, 4, 4, this.gradients[0]);
        d2d.FillRoundedRectangle(0, 0, this.width, Blueprint.captionHeight, 4, 4, this.gradients[1]);
        //d2d.FillRectangle(0, 0, this.width, Blueprint.captionHeight, this.gradients[0]);
        //d2d.FillRectangle(0, 0, this.width, Blueprint.captionHeight, this.gradients[1]);
        colorBrush.SetColor(1.0, 1.0, 1.0);
        d2d.DrawText(this.title, font, 21, 0, this.width, Blueprint.captionHeight, colorBrush);

        d2d.DrawRoundedRectangle(2, 2, this.width-2, Blueprint.captionHeight-2, 2, 2, this.gradients[3], 1);
        //d2d.FillRectangle(0, Blueprint.captionHeight, this.width, this.height, this.gradients[2]);
        for(let i = 0; i < this.parameters.length; i++) {
            const param = this.parameters[i];
            d2d.FillRectangle(Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 100, this.height, this.gradients[4+i]);
            colorBrush.SetColor(...Blueprint.paramColors[param]);
            d2d.DrawEllipse(Blueprint.padding-8, (i+1)*Blueprint.captionHeight+Blueprint.padding, Blueprint.radius, Blueprint.radius, colorBrush, 2);
            colorBrush.SetColor(1.0, 1.0, 1.0); 
            //d2d.DrawText(param, font, Blueprint.padding, (i+1)*Blueprint.captionHeight + Blueprint.padding, this.width, this.height, colorBrush);
            d2d.DrawTextLayout(Blueprint.padding, (i+1)*Blueprint.captionHeight + Blueprint.padding, this.paramText[i], colorBrush);
            //d2d.DrawRectangle(Blueprint.padding-8-Blueprint.radius-2, (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2, Blueprint.padding-8-Blueprint.radius-2+(Blueprint.radius*2+2), (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2+(Blueprint.radius*2+2), colorBrush);
            const connection = this.connections.in[i];
            if(connection) {
                const textHeight = this.paramText[i].GetMetrics().height;
                
                d2d.DrawLine(Blueprint.padding, (i+1)*Blueprint.captionHeight + Blueprint.padding+textHeight, 100, (i+1)*Blueprint.captionHeight + Blueprint.padding+textHeight, colorBrush);
            }
        }
        for(let i = 0; i < this.out.length; i++) {
            const op = this.out[i];
            const tl = this.outText[i];
            const y = (i+1)*Blueprint.captionHeight+Blueprint.padding;
            //print(tl.GetMetrics());
            const textmetrics = tl.GetMetrics();
            d2d.DrawTextLayout(this.width-10-textmetrics.width, y, tl, colorBrush);
            colorBrush.SetColor(...Blueprint.paramColors[op]);
            d2d.DrawEllipse(this.width-8, y, Blueprint.radius, Blueprint.radius, colorBrush, 2);
            colorBrush.SetColor(1.0, 1.0, 1.0);

            const connection = this.connections.out[i];
            if(connection) {
                const r = connection.receiver;
                if(r) {
                    connection.x = r.source.x+Blueprint.padding-8;
                    connection.y = r.source.y+((r.i+1)*Blueprint.captionHeight+Blueprint.padding);
                }
                d2d.DrawLine(this.width-10-textmetrics.width, y+textmetrics.height, this.width-8-4, y+textmetrics.height, colorBrush);
                    //remember that i set transform before calling Blueprint.redraw so i gotta do math to get screen coords
                //d2d.DrawLine(this.width-8, y, connection.x-this.x, connection.y-this.y, colorBrush, 4); //maybe there's a drawbezier or something like that for paths or whatevers
                //do i have to make this path every time?
                //i don't think you can save a geometry sink and change it

                //const quarterX = this.width-8 + (connection.x-this.x-this.width-8)/4;
                //const quarterY = y + (connection.y-this.y)/4;
                //const halfX = this.width-8 + (connection.x-this.x-this.width-8)/2;
                //const halfY = y + (connection.y-this.y)/2;
                //const halfX = ((this.width-8)+connection.x-this.x)/2; //idk how these worked bruh for some reason it took forever for me to understand how exactly my math should be mathing
                //const halfY = (y+connection.y-this.y)/2;
                //const getXAlong = (function(t) {
                //    return (connection.x-this.x-this.width-8)*t;
                //}).bind(this);

                //const getYAlong = (function(t) {
                //    return (connection.y-this.y-y)*t;
                //}).bind(this);
                //d2d.DrawEllipse(halfX, halfY, 10, 10, colorBrush, 4);
                //d2d.DrawEllipse(quarterX, quarterY, 5, 5, colorBrush, 4);
                //print(draws);
                //d2d.DrawEllipse(this.width-8 + getXAlong(draws/100), y + getYAlong(draws/100), 5, 5, colorBrush, 4);
                
                //print(`c: {x: ${connection.x},y: ${connection.y}}\tthis: {x: ${this.x}, y: ${this.y}}`);
                //print(`clientc: {x: ${connection.x-this.x},y: ${connection.y-this.y}}\tthis: {x: ${this.x}, y: ${this.y}}`);

                const halfX = this.width-8 + this.getXAlong(connection, .5);
                const halfY = y + this.getYAlong(connection, y, .5);

                const path = d2d.CreatePathGeometry();
                const sink = path.Open();

                sink.BeginFigure(this.width-8, y, D2D1_FIGURE_BEGIN_HOLLOW);
                    sink.AddBeziers(
                        [
                            [this.width-8, y], //FloatFI(info[0].As<Array>()->Get(context, 0).ToLocalChecked().As<Array>()->Get(context, 0).ToLocalChecked())
                            [this.width-8 + this.getXAlong(connection, .4), y],
                            [halfX, halfY],
                        ],
                        [
                            [halfX, halfY],
                            [halfX, y + this.getYAlong(connection, y, .9)],
                            [connection.x-this.x, connection.y-this.y],
                        ]
                    );
                sink.EndFigure(D2D1_FIGURE_END_OPEN);

                sink.Close();
                print(sink.Release(), "sink release?");
                d2d.DrawGeometry(path, colorBrush, 4);
                print(path.Release(), "path release?}"); //lowkey idk if this is getting released but idk how to check
            }
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
            //if(mouse.x > this.width-4) {
            //    return [RIGHT];
            //}
            for(let i = 0; i < this.parameters.length; i++) {
                if(withinBounds({x: Blueprint.padding-8-Blueprint.radius-2, y: (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2, width: Blueprint.radius*2+2, height: Blueprint.radius*2+2}, mouse)) {
                    return [DROP, i];
                }
            }
            for(let i = 0; i < this.out.length; i++) {
                if(withinBounds({x: this.width-8-Blueprint.radius, y: (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2, width: Blueprint.radius*2+2, height: Blueprint.radius*2+2}, mouse)) {
                    return [DRAG, i];
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
        for(let i = 0; i < this.paramText.length; i++) {
            this.paramText[i].Release();
        }
        for(let i = 0; i < this.outText.length; i++) {
            this.outText[i].Release();
        }
        blueprints.splice(blueprints.indexOf(this), 1);
    }

    preDrag(mouse, data) {
        activePin = {i: data, source: this};
        if(this.connections.out[data]) {
            const connection = this.connections.out[data];
            connection.receiver.source.connections.in[connection.receiver.i] = undefined;
            //connection.x = mouse.x;
            //connection.y = mouse.y;
        }//else {
            this.connections.out[data] = {x: mouse.x, y: mouse.y};
        //}
        return this.connections.out[data];
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
    d2d.Clear(0.0, 0.0, 0.0, 0.25);
    //d2d.SetTransform(Matrix3x2F.Translation(camera.x, camera.y));
    //d2d.DrawBitmap(drawing, 0, 0, w, h);
    for(const blueprint of blueprints) {
        d2d.SaveDrawingState();
        //oh wait you can't do this d2d.GetTransform().Translation as it returns the straight up D2D1_MATRIX_3X2_F 
        d2d.SetTransform(Matrix3x2F.Translation(blueprint.x+camera.x, blueprint.y+camera.y));
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
        Blueprint.paramColors["SHADER"] = [200/255, 200/255, 200/255];
        Blueprint.paramColors["string"] = [251/255, 0/255, 209/255];
        Blueprint.paramColors["number"] = [27/255, 191/255, 147/255];
        Blueprint.paramColors["bool"] = [146/255, 0.0, 0.0];
        //DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES
        //uxtheme = DllLoad("UxTheme.dll");
        //print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
        //print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
        //let result = uxtheme("SetWindowTheme", 3, [hwnd, NULL, NULL], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER); //NO FUCKING WAY?!
        //print(result, "result");
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(24, 24, 24)); //hell yeah this shit tuff asf (dark title bar)[doesn't work if you get rid of the window theme tho]
        
        //otherwnd = new BottomPane(hwnd); //no longer blocks the thread as i make and draw every control myself
        blueprints.push(new Blueprint(hwnd, "Program", [95/255, 150/255, 187/255], 300, 100, 221, 90*2, ["fragmentShader : FRAGMENT_SHADER", "vertexShader : VERTEX_SHADER"], []));
        blueprints.push(new Blueprint(hwnd, "Shader", [120/255, 168/255, 115/255], 0, 100, 221, 90, ["filename : string", "type : number"], ["SHADER"]));
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
        mouse.x -= camera.x;
        mouse.y -= camera.y;
        //let result = 0;
        hit = {};
        //hitblueprint = undefined;
        for(const blueprint of blueprints) {
            if(withinBounds(blueprint, mouse)) {
                //hitblueprint = undefined;

                const clientmouse = {x: mouse.x-blueprint.x, y: mouse.y-blueprint.y};
                //mouse.x -= blueprint.x;
                //mouse.y -= blueprint.y; //to client (oops i was directly modifying mouse)
                const [legit, data] = blueprint.hittest(clientmouse);
                //hit |= legit; //lowkey i was just OR ing them together to make it easier
                //if(legit != 0) {
                    hit.result = legit;
                    hit.blueprint = blueprint;
                    if(legit) {
                        //hitblueprint = legit == BUTTON ? data : blueprint;
                        hit.data = data;
                    }
                //}
            }
        }
        for(const [flag, cursor] of hittestarr) {
            //if((hit & flag) == flag) {
            if(hit.result == flag) { //i had to change hit to be only one value because if the topmost blueprint set TOP and a blueprint below set MOVE, it would use MOVE because it was the last element of hittestarr (wait a second that's not even the current problem)
                SetCursor(cursor);
            }
        }
        if(hit.result) {
            dirty = true;
            //SetCursor(arrow);
            return 1; //return true from WM_SETCURSOR to halt further processing (AND MOST IMPORTANTLY, RETURNING A VALUE OTHER THAN 0 DOES NOT CALL DefWindowProc NO MATTWR WHAT!!!!!)
        }
    }else if(msg == WM_LBUTTONDOWN) {
        SetCapture(hwnd);
        const mouse = {x: GET_X_LPARAM(lp)-camera.x, y: GET_Y_LPARAM(lp)-camera.y}; //lp is client mouse pos
        if(hit.result) {
            //if((hit.result & BUTTON) == BUTTON) {
            if(hit.result == BUTTON) {
                hit.data.mouseDown(mouse);
                activeButton = hit.data;
            }else //if((hit.result & MOVE) == MOVE) {
            if(hit.result == MOVE) {
                Draggable.select(hit.blueprint, mouse, false, false);
            }else if(hit.result == CONTEXTMENU || hit.result == DROP) {
                //no
            }else if(hit.result == DRAG) {
                Draggable.select(hit.blueprint.preDrag?.(mouse, hit.data) ?? hit.blueprint, mouse, false, false);
            }else {
                //const updown = ((hit.result & TOP) == TOP) || ((hit.result & BOTTOM) == BOTTOM);
                const updown = hit.result == TOP || hit.result == BOTTOM;
                Draggable.select(hit.blueprint, mouse, updown, !updown);
            }
        }

        for(const blueprint of blueprints) {
            if(blueprint.x <= mouse.x && blueprint.y <= mouse.y) {
                mouse.x -= blueprint.x;
                mouse.y -= blueprint.y; //to client
                //hit |= blueprint.hittest(mouse);
                blueprint.mouseDown?.(mouse);
            }
        }
    }else if(msg == WM_RBUTTONDOWN) {
        const mouse = {x: GET_X_LPARAM(lp)-camera.x, y: GET_Y_LPARAM(lp)-camera.y}; //lp is client mouse pos

        if(hit.result == BUTTON) {
            hitblueprint.rightMouseDown?.(mouse);
        }else if(hit.result == CONTEXTMENU) {
            const screenmousepos = GetCursorPos();
            hitblueprint.preContextMenu?.(screenmousepos);
            TrackPopupMenu(hitblueprint.contextMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, screenmousepos.x, screenmousepos.y, hwnd);
        }

        for(const blueprint of blueprints) {
            if(blueprint.x <= mouse.x && blueprint.y <= mouse.y) {
                mouse.x -= blueprint.x;
                mouse.y -= blueprint.y; //to client
                //hit |= blueprint.hittest(mouse);
                blueprint.rightMouseDown?.(mouse);
            }
        }
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture();
        Draggable.mouseUp();

        const mouse = {x: GET_X_LPARAM(lp)-camera.x, y: GET_Y_LPARAM(lp)-camera.y}; //lp is client mouse pos
        //if(hit == BUTTON) {
        //    hitblueprint.mouseUp(mouse);
        //}
        if(activeButton) {
            activeButton.mouseUp?.(mouse);
            dirty = true;
        }
        if(activePin) {
            //print(hit);
            //dang it bruh WM_SETCURSOR doesn't fire when holding the mouse down and so hit.blueprint is still/actually activePin.source
            let receiver;
            for(const blueprint of blueprints) {
                if(withinBounds(blueprint, mouse)) {
                    //hitblueprint = undefined;
    
                    const clientmouse = {x: mouse.x-blueprint.x, y: mouse.y-blueprint.y};
                    //mouse.x -= blueprint.x;
                    //mouse.y -= blueprint.y; //to client (oops i was directly modifying mouse)
                    const [legit, data] = blueprint.hittest(clientmouse);
                    if(legit == DROP) {
                        receiver = {i: data, source: blueprint};
                    }
                }
            }    
    
            if(receiver) {
                activePin.source.connections.out[activePin.i].receiver = receiver; //{i: receiver.data, source: receiver.blueprint};
                receiver.source.connections.in[receiver.i] = activePin; //.source = activePin;
                //print(activePin.i, receiver.i);
            }else {
                //if(activePin.source.connections.out[activePin.i]?.receiver) { //moved into preDrag
                //    const receiver = activePin.source.connections.out[activePin.i].receiver;
                //    receiver.source.connections.in[receiver.i] = undefined;
                //    print(activePin.i, "prev", receiver.i);
                //}
                activePin.source.connections.out[activePin.i] = undefined;
            }
        }
        activePin = undefined;
        activeButton = undefined;


        for(const blueprint of blueprints) {
            if(blueprint.x <= mouse.x && blueprint.y <= mouse.y) {
                mouse.x -= blueprint.x;
                mouse.y -= blueprint.y; //to client
                //hit |= blueprint.hittest(mouse);
                blueprint.mouseUp?.(mouse);
            }
        }
    }else if(msg == WM_COMMAND) {
        if(hit.result == CONTEXTMENU) { //mango
            hit.blueprint.onCommand(wp, lp);
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
    }else if(msg == WM_MBUTTONDOWN) {
        if(!Draggable.dragging) {
            SetCapture(hwnd);
            const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos
            Draggable.select(camera, mouse, false, false);
        }
    }else if(msg == WM_MBUTTONUP) {
        ReleaseCapture();
        Draggable.mouseUp();
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0); //but it refused.
    }

    if(Draggable.dragging) {
        const mouse = GetCursorPos();
        ScreenToClient(hwnd, mouse);
        if(Draggable.dragged != camera) {
            mouse.x -= camera.x;
            mouse.y -= camera.y;
        }
        Draggable.update(mouse);
    }

    if(dirty) {
        print("DIRTY!!!", Int_To_WM(msg), Math.random());
        d2dpaint();
        dirty = false;
        draws++;
    }

    //for(const blueprint of blueprints) {
    //    if(blueprint.x <= mouse.x && blueprint.y <= mouse.y) {
    //        mouse.x -= blueprint.x;
    //        mouse.y -= blueprint.y; //to client
    //        //hit |= blueprint.hittest(mouse);
    //        blueprint.windowProc(hwnd, msg, wp, lp);
    //    }
    //}
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = arrow;//NULL; //LoadCursor(NULL, IDC_ARROW); //im using NULL here because im changing SetCursor myself here (nevermind i stopped using NULL because i handle the WM_SETCURSOR event and when i don't change the cursor i have DefWindowProc do the work)

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "shadereditor like unreal blueprints", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);
