//const rp = print;
//print = function(...args) {};

let wic, d2d, font, colorBrush, roundStrokeStyle, specialBitmap;

let dirty = false;
let hit = {}; // {result, pane, data}
//let hitpane;
let activeButton;
let activePin;
let draws = 0;
let throwawayObjects = [];

const typeRegex = /(.+) *: *(.+)/;

const arrow = LoadCursor(NULL, IDC_ARROW);
const hand = LoadCursor(NULL, IDC_HAND);

const Int_To_WM = function() { //this gotta be the only good reason to use a closure
    const wm = {}; //with a closure im using wm like it's static!!!
    Object.entries(globalThis).filter(([key, value]) => { //wait why am i doing a filter instead of just forEach
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

//GLManager.programs.push({name: "fortnite", vertexid: 0, fragmentid: 1}, {name: "fortnite", vertexid: 0, fragmentid: 1}  );

function withinBounds({x, y, width, height}, pair) {
    return pair.x > x && pair.y > y && pair.x < x+width && pair.y < y+height;
}

const TOP = 0b0000000001;
const LEFT = 0b0000000010;
const RIGHT = 0b0000000100;
const BOTTOM = 0b0000001000;
const BUTTON  = 0b0000010000;
const MOVE     = 0b0000100000;
const CONTEXTMENU=0b0001000000;
const DROP        =0b0010000000;
const DRAG         =0b0100000000;
const TEXT          =0b1000000000;

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
    [TEXT, LoadCursor(NULL, IDC_IBEAM)],
];

const BPTYPE_PURE = 0;
const BPTYPE_NOTPURE = 1;
const BPTYPE_EVENT = 2;
const BPTYPE_DATATYPE = 3;

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

class Editable { //for text :smirk:
    static caret = 0;
    static editing = false;
    static edited = undefined;
    static returntoquit = true;

    static ctrlDelimiters = [".", " "]; //points where using ctrl+backspace/delete will stop
    //static ctrlDelimiters = /[."]/;

    static beginInput(caret = 0, tobeedited, returntoquit = true) {
        Editable.caret = caret;
        Editable.edited = tobeedited;
        Editable.edited.value = Editable.edited.value.toString(); //just in case lol
        Editable.editing = true;
        Editable.returntoquit = returntoquit;
        print("HELL YEAH BEGIN INPUT");
    }

    static ctrlMoveBack() {
        for(let j = Editable.caret-2; j >= 0; j--) { //lowkey idk why i have to subtract 2
            for(const delim of Editable.ctrlDelimiters) {
                if(Editable.edited.value[j] == delim) {
                    //print("delim nigga", j, Editable.edited.value[j], delim);
                    const i = j+1;
                    const count = (Editable.caret-i);
                    //break; //god damn it i swear in js break would work in nested loops
                    //break bruh;
                    return {i, count};
                }
            }
            if(j == 0) {
                const i = 0;
                const count = Editable.caret;
                return {i, count};
            }
        }
        return {i: 0, count: 0}
    }

    static ctrlMoveForward() {
        for(let j = Editable.caret+1; j < Editable.edited.value.length; j++) { //plus one here to skip the possible delim in front
            for(const delim of Editable.ctrlDelimiters) {
                if(Editable.edited.value[j] == delim) {
                    //print("delim nigga", j, Editable.edited.value[j], delim);
                    const count = j-(Editable.caret+1);
                    //break; //god damn it i swear in js break would work in nested loops
                    //break bruh;
                    return count;
                }
            }
            if(j == Editable.edited.value.length) {
                return (Editable.caret+1)-j;
            }
        }
        return Editable.edited.value.length-(Editable.caret+1);
    }

    static modify(keycode) { //modify is for delete and page up and what not
        if(keycode == VK_LEFT || keycode == VK_BACK) {
            //Editable.caret = Math.max(0, Editable.caret-1);
            //Editable.caret--;
            //if(Editable.caret < 0) {
            //    Editable.caret = 0;
            //}
            let i = Editable.caret-1;

            if(keycode == VK_BACK) {
                //Editable.edited.value = Editable.edited.value.split("").splice(Editable.caret, 1).join();
                let count = 1;
                if(GetKey(VK_CONTROL)) {
                    const ret = Editable.ctrlMoveBack();
                    i = ret.i;
                    count = ret.count;
                }
                const arr = Editable.edited.value.split("");
                //print("post", arr, i, count);
                arr.splice(i, count);
                Editable.edited.value = arr.join("");
            }else {
                if(GetKey(VK_CONTROL)) {
                    const ret = Editable.ctrlMoveBack();
                    i = ret.i;
                }
            }

            Editable.caret = Math.max(0, i);
        }else if(keycode == VK_RIGHT) {
            //Editable.caret = Math.min(Editable.edited.value.length, Editable.caret+1);
            //Editable.caret++;
            //if(Editable.caret > Editable.edited.value.length) {
            //    Editable.caret = Editable.edited.value.length;
            //}
            
            let i = Editable.caret+1;
            if(GetKey(VK_CONTROL)) {
                i += Editable.ctrlMoveForward();
            }

            Editable.caret = Math.min(Editable.edited.value.length, i);
        }else if(keycode == VK_UP || keycode == VK_PRIOR || keycode == VK_HOME) { //page up
            Editable.caret = Editable.edited.value.length;
        }else if(keycode == VK_DOWN || keycode == VK_NEXT || keycode == VK_END) { //page down
            Editable.caret = 0;
        }else if(keycode == VK_DELETE) {
            //damn i thought you could chain them
            //Editable.edited.value = Editable.edited.value.split("").splice(Editable.caret, 1).join();
            let count = 1;
            if(GetKey(VK_CONTROL)) {
                count += Editable.ctrlMoveForward();
            }
            const arr = Editable.edited.value.split("");
            arr.splice(Editable.caret, count);
            Editable.edited.value = arr.join("");
        }else if(keycode == VK_RETURN && Editable.returntoquit) {
            return Editable.endInput();
        }

        dirty = true;
    }

    static writechar(char) {
        if(GetKey(VK_CONTROL) && char == "a") {
            //lowkey idk about highlighting like that so im just moving the carot
        }
        //Editable.edited.value = Editable.edited.value.split("").splice(Editable.caret, 0, char).join();
        const arr = Editable.edited.value.split("");
        arr.splice(Editable.caret, 0, char);
        Editable.edited.value = arr.join("");

        Editable.caret++;

        dirty = true;
    }

    static endInput() {
        Editable.edited.endInput?.();
        Editable.edited = undefined;
        Editable.editing = false;
        print("END INPUT");
        
        dirty = true;
    }
}

class Gradient {
    static LinearGradientBrush(gradientStop, ...args) {
        return new Gradient(gradientStop, d2d.CreateLinearGradientBrush(...args, gradientStop));
    }

    static RadialGradientBrush(gradientStop, ...args) {
        return new Gradient(gradientStop, d2d.CreateRadialGradientBrush(...args, gradientStop));
    }

    constructor(gradientStop, gradient) {
        this.gradientStop = gradientStop;
        this.gradient = gradient;
        //haha lowkey i just remembered that if i actually made an internalPtr property on this object it would be valid to pass this object directly into a d2d function!
        this.internalPtr = this.gradient.internalPtr; //LNMAO
    }

    Release() {
        this.gradient.Release();
        this.gradientStop.Release();
    }
}

const PRIMITIVE_TOGGLE = 0;
const PRIMITIVE_INPUT = 1;
const PRIMITIVE_DROPDOWN = 2; //maybe...

class PrimitiveControl { //hell yeah brother (this object isn't meant to be on its own and is used in Blueprint)
    static validPrimitives = {string: [PRIMITIVE_INPUT], number: [PRIMITIVE_INPUT, "number"], boolean: [PRIMITIVE_TOGGLE]};

    type = PRIMITIVE_TOGGLE;
    value = undefined;
    data = undefined; //data for PRIMITIVE_DROPDOWN
    geometry = undefined; //random additional d2d stuff like a path geometry (for toggle) or a text layout (for input)
    width = 16;
    height = 16;

    constructor(type, data) {
        this.type = type;
        this.data = data;

        if(this.type == PRIMITIVE_TOGGLE) {
            this.geometry = d2d.CreatePathGeometry();
            const sink = this.geometry.Open();
            sink.BeginFigure(4, 9, D2D1_FIGURE_BEGIN_HOLLOW); //lowkey just looked a picture of a checked boolean parameter
            sink.AddLine(7, 11);
            sink.AddLine(13, 5);
            sink.EndFigure(D2D1_FIGURE_END_OPEN);
            sink.Close();
            sink.Release();

            this.value = 0;
        }else if(type == PRIMITIVE_INPUT) {
            this.value = "";
            this.geometry = d2d.CreateTextLayout(this.value, font, 100, 16);
        }
    }

    redraw() {
        if(this.type == PRIMITIVE_TOGGLE) {
            colorBrush.SetColor(.3, .3, .3);
            d2d.FillRoundedRectangle(0, 0, 16, 16, 2, 2, colorBrush);
            colorBrush.SetColor(1.0, 1.0, 1.0);
            if(this.value) {
                d2d.DrawGeometry(this.geometry, colorBrush, 2); //no round stroke style for htis one
            }
            d2d.DrawRoundedRectangle(0, 0, 16, 16, 2, 2, colorBrush, 2, roundStrokeStyle);
        }else if(this.type == PRIMITIVE_INPUT) {
            //damn i might have to draw the caret myself in here
            if(this.geometry.text != this.value) { //haha just now added this property
                const {widthIncludingTrailingWhitespace} = this.geometry.GetMetrics();
                this.geometry.Release();
                this.geometry = d2d.CreateTextLayout(this.value, font, 100, 16);
                this.width = Math.max(16, 16+widthIncludingTrailingWhitespace);
            }
            
            if(Editable.edited == this) {
                //const t = d2d.CreateTextLayout(this.value.slice(0, Editable.caret), font, 100, 16);
                //const {widthIncludingTrailingWhitespace} = t.GetMetrics(); //if there are trailing spaces it doesn't show that and it's weird

                
                const hit = this.geometry.HitTestTextPosition(Editable.caret, false); //who knew this function's main purpose was this use case
                //print(hit.x, hit.hitTestMetrics.width);
                const caretX = hit.x;

                
                //const pos = ; //lowkey might have to make a text layout to see how wide each character is
                d2d.DrawLine(caretX, 0, caretX, 16, colorBrush, 1, roundStrokeStyle);
                //t.Release();
            }
            d2d.DrawRoundedRectangle(0, 0, this.width, 16, 2, 2, colorBrush, 1, roundStrokeStyle);
            d2d.DrawTextLayout(0, 0, this.geometry, colorBrush);
        }
    }

    buttonDown(mouse) {
        if(this.type == PRIMITIVE_TOGGLE) {
            this.value = !this.value;
        }
    }

    endInput() {
        if(this.type == PRIMITIVE_INPUT && this.data == "number") {
            this.value = Number(this.value) || 0; //NaN is falsy but not nullish (no nullish coalescing today)
        }
    }

    hittest(mouse) {
        //print(mouse);
        if(withinBounds({x: 0, y: 0, width: this.width, height: this.height}, mouse)) {
            if(this.type == PRIMITIVE_TOGGLE) {
                return [BUTTON, this];
            }else if(this.type == PRIMITIVE_INPUT) {
                const i = this.geometry.HitTestPoint(mouse.x, mouse.y).hitTestMetrics.textPosition; //calculate...
                //print(i);
                return [TEXT, [i, this]];
            }
        }
    }

    destroy() {
        this.geometry?.Release();
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
    parameters = []; //i JUST realized that parameters should be an array of objects
    out = [];
    type = BPTYPE_PURE;

    //gradientStops = [];
    gradients = [];
    //paramText = []; //efficientcy
    //outText = [];

    connections = {in: [], out: []};

    static padding = 16;
    static radius = 4;

    static create(parent, title, color, x, y, width, height, parameters, out, type) {
        const b = new Blueprint(parent, color, title, x, y, width, height, parameters, out, type);
        panes.push(b);
        return b;
    }

    constructor(parent, title, color, x, y, width, height, parameters, out, type) {
        this.parent = parent; //just in case?
        this.title = title;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.parameters = parameters; //parameters and out come in as arrays of strings but are stored as arrays of objects
        this.out = out;
        this.type = type;
        this._special = false;

        //this.gradientStops.push(
        //    //d2d.CreateGradientStopCollection([0.0, 0.0, 67/255, 255/255], [0.8, 32/255, 32/255, 32/255]),
        //    d2d.CreateGradientStopCollection([0.0, ...color], [0.85, 32/255, 32/255, 32/255]),
        //    d2d.CreateGradientStopCollection([0.0, 32/255, 32/255, 32/255], [0.4, 0.0, 0.0, 0.0, 0.0]),
        //    d2d.CreateGradientStopCollection([0.0, 27/255, 28/255, 27/255], [0.4, 19/255, 21/255, 19/255], [.8, 15/255, 17/255, 15/255]),
        //    d2d.CreateGradientStopCollection([0.0, ...color], [0.2, 0.0, 0.0, 0.0, 0.0]),
        //);
        //
        //this.gradients.push( //https://learn.microsoft.com/en-us/windows/win32/api/d2d1/ns-d2d1-d2d1_linear_gradient_brush_properties
        //    d2d.CreateLinearGradientBrush(0,0,this.width,/*this.height*/ Blueprint.captionHeight, this.gradientStops[0]),
        //    d2d.CreateRadialGradientBrush(this.width/3, Blueprint.captionHeight/2, 0, 0, this.width, Blueprint.captionHeight, this.gradientStops[1]),
        //    d2d.CreateLinearGradientBrush(0, Blueprint.captionHeight, this.width, this.height, this.gradientStops[2]),
        //    d2d.CreateLinearGradientBrush(2, 2, 2, Blueprint.captionHeight-2, this.gradientStops[3]), //pointing down
        //);

        this.gradients.push(
            Gradient.LinearGradientBrush(
                d2d.CreateGradientStopCollection([0.0, ...color], [0.85, 32/255, 32/255, 32/255]),
                0,0,this.width,/*this.height*/ Blueprint.captionHeight, //CreateLinearGradientBrush args (don't include the gradientStop because Gradient.LinearGradientBrush does it for you)
            ),
            Gradient.RadialGradientBrush(
                d2d.CreateGradientStopCollection([0.0, 32/255, 32/255, 32/255], [0.4, 0.0, 0.0, 0.0, 0.0]),
                this.width/3, Blueprint.captionHeight/2, 0, 0, this.width, Blueprint.captionHeight,
            ),
            Gradient.LinearGradientBrush(
                d2d.CreateGradientStopCollection([0.0, 27/255, 28/255, 27/255], [0.4, 19/255, 21/255, 19/255], [.8, 15/255, 17/255, 15/255]),
                0, Blueprint.captionHeight, this.width, this.height,
            ),
            Gradient.LinearGradientBrush(
                d2d.CreateGradientStopCollection([0.0, ...color], [0.2, 0.0, 0.0, 0.0, 0.0]),
                2, 2, 2, Blueprint.captionHeight-2, //pointing down
            ),
        )

        if(this.type == BPTYPE_NOTPURE || this.type == BPTYPE_EVENT) {
            if(this.type == BPTYPE_NOTPURE) {
                //this.parameters[i] = "exec"; //i don't need the variable name anymore because i store it in the text layout paramText[i]
                //const gsc = d2d.CreateGradientStopCollection([0.0, ...Blueprint.paramColors[param]], [0.5, 0.0, 0.0, 0.0, 0.0]);
                //this.paramText.push(d2d.CreateTextLayout("", font, w, h));
                ////this.gradientStops.push(gsc);
                ////this.gradients.push(d2d.CreateRadialGradientBrush(Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight, gsc));
                //this.gradients.push(
                //    Gradient.RadialGradientBrush(
                //        gsc,
                //        Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight,
                //    )
                //);
                this.parameters.splice(0, 0, "exec : exec"); //inserting exec : exec as the first parameter
            }
            this.out.splice(0, 0, " : exec"); //inserting  : exec as the first out pin
        }

        for(let i = 0; i < this.parameters.length; i++) {
            const [_, name, param] = this.parameters[i].match(typeRegex);

            this.addPin(false, i, param, name);
            //print(_, name, param, Blueprint.paramColors[param]);
            //this.parameters[i] = param; //i don't need the variable name anymore because i store it in the text layout paramText[i]
            //const gsc = d2d.CreateGradientStopCollection([0.0, ...Blueprint.paramColors[param]], [0.5, 0.0, 0.0, 0.0, 0.0]);
            //this.paramText.push(d2d.CreateTextLayout(name, font, w, h));
            ////this.gradientStops.push(gsc);
            ////this.gradients.push(d2d.CreateRadialGradientBrush(Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight, gsc));
            //this.gradients.push(
            //    Gradient.RadialGradientBrush(
            //        gsc,
            //        Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight,
            //    )
            //);
        }

        for(let i = 0; i < this.out.length; i++) {
            //const op = this.out[i];
            const [_, name, op] = this.out[i].match(typeRegex);

            this.addPin(true, i, op, name);
            //const gsc = d2d.CreateGradientStopCollection([0.0, ...Blueprint.paramColors[op]], [0.5, 0.0, 0.0, 0.0, 0.0]);
            //this.outText.push(d2d.CreateTextLayout(op, font, w, h));
            ////this.gradientStops.push(gsc);
            ////this.gradients.push(d2d.CreateRadialGradientBrush(Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight, gsc));
            //this.gradients.push(
            //    Gradient.RadialGradientBrush(
            //        gsc,
            //        Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight,
            //    )
            //);
        }
    }

    addPin(out, i, param, name) { //lol in js you can't use 'in' as the name of a function parameter
        const pobj = {type: param, text: d2d.CreateTextLayout(name, font, w, h)}; //pobj
        if(!out) {
            if(PrimitiveControl.validPrimitives[param] != undefined) { //oops
                pobj.control = new PrimitiveControl(...PrimitiveControl.validPrimitives[param]);
            }
            this.parameters[i] = pobj; //i don't need the variable name anymore because i store it in the text layout paramText[i]
            //this.paramText.push(d2d.CreateTextLayout(name, font, w, h));
        }else {
            this.out[i] = pobj;
            //this.outText.push(d2d.CreateTextLayout(name, font, w, h));
        }
        const gsc = d2d.CreateGradientStopCollection([0.0, ...Blueprint.paramColors[param]], [0.5, 0.0, 0.0, 0.0, 0.0]);

        this.gradients.push(
            Gradient.RadialGradientBrush(
                gsc,
                Blueprint.padding, (i+1)*Blueprint.captionHeight+Blueprint.padding, 0, 0, this.width/2, Blueprint.captionHeight,
            )
        );
    }

    drawPin(out, i, param, connection) {
        const y = (i+1)*Blueprint.captionHeight+Blueprint.padding;
        let ex;
        if(!out) {
            ex = Blueprint.padding-8;
            d2d.FillRectangle(Blueprint.padding, y, 100, this.height, this.gradients[4+i]);
            colorBrush.SetColor(...Blueprint.paramColors[param.type]);
            //d2d.DrawEllipse(Blueprint.padding-8, y, Blueprint.radius, Blueprint.radius, colorBrush, 2);
            //colorBrush.SetColor(1.0, 1.0, 1.0);
            //d2d.DrawText(param, font, Blueprint.padding, (i+1)*Blueprint.captionHeight + Blueprint.padding, this.width, this.height, colorBrush);
            d2d.DrawTextLayout(Blueprint.padding, y, /*this.paramText[i]*/ param.text, colorBrush);
            //d2d.DrawRectangle(Blueprint.padding-8-Blueprint.radius-2, (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2, Blueprint.padding-8-Blueprint.radius-2+(Blueprint.radius*2+2), (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2+(Blueprint.radius*2+2), colorBrush);
        }else {
            const tl = param.text; //this.outText[i];
            //print(tl.GetMetrics());
            const {width} = tl.GetMetrics();
            d2d.DrawTextLayout(this.width-10-width, y, tl, colorBrush);
            colorBrush.SetColor(...Blueprint.paramColors[param.type]);
            ex = this.width-8;
            //d2d.DrawEllipse(this.width-8, y, Blueprint.radius, Blueprint.radius, colorBrush, 2);
            //colorBrush.SetColor(1.0, 1.0, 1.0);
        }
        if(param.type == "exec") {
            //draw traingel 
            //(why doesn't d2d have an easy triangle primitive function type hsit)
            const path = d2d.CreatePathGeometry();
            const sink = path.Open();
            sink.BeginFigure(ex-2.5, y-5, D2D1_FIGURE_BEGIN_FILLED);
            sink.AddLine(ex+5, y);
            sink.AddLine(ex-2.5, y+5);
            sink.EndFigure(D2D1_FIGURE_END_CLOSED);
            sink.Close();
            sink.Release();
            const args = [path, colorBrush];
            
            if(connection) {
                d2d.FillGeometry(...args);
            }else {
                d2d.DrawGeometry(...args, 2, roundStrokeStyle);
            }
            //d2d[`${connection ? "Fill" : "Draw"}Geometry`](path, colorBrush, connection ? undefined : 2);
            //path.Release(); //ok this is a HUGE leak bruh this shit isn't getting released!!!
            throwawayObjects.push(path);
        }else {
            d2d[`${connection ? "Fill" : "Draw"}Ellipse`](ex, y, Blueprint.radius, Blueprint.radius, colorBrush, 2, roundStrokeStyle); //passing 2 as the 6th parameter for FillEllipse will not do anything because it doesn't have a 6th parameter (it is for DrawEllipse's strokeWidth)
        }
        colorBrush.SetColor(1.0, 1.0, 1.0);
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

        if(this._special) {
            d2d.DrawBitmap(specialBitmap, this.width-16-2, 2.5, this.width-2, 16+2.5);
        }

        //d2d.FillRectangle(0, Blueprint.captionHeight, this.width, this.height, this.gradients[2]);
        for(let i = 0; i < this.parameters.length; i++) {
            const param = this.parameters[i];
            const connection = this.connections.in[i];
            this.drawPin(false, i, param, connection);
            const tl = param.text.GetMetrics(); //this.paramText[i].GetMetrics();
            if(connection) {
                d2d.DrawLine(Blueprint.padding, (i+1)*Blueprint.captionHeight + Blueprint.padding+tl.height, Blueprint.padding+tl.width, (i+1)*Blueprint.captionHeight + Blueprint.padding+tl.height, colorBrush);
            }else if(param.control) {
                d2d.SetTransform(Matrix3x2F.Translation(this.x+camera.x+Blueprint.padding+tl.width+8, this.y+camera.y+(i+1)*Blueprint.captionHeight + Blueprint.padding));
                param.control.redraw();
                d2d.SetTransform(Matrix3x2F.Translation(this.x+camera.x, this.y+camera.y));
            }
        }
        for(let i = 0; i < this.out.length; i++) {
            const op = this.out[i];
            const anyconnections = Object.values(this.connections.out[i] ?? {});
            this.drawPin(true, i, op, anyconnections.length);
            if(anyconnections.length) { //now there can be multiple out
                const textmetrics = op.text.GetMetrics(); //this.outText[i].GetMetrics();
                const y = (i+1)*Blueprint.captionHeight+Blueprint.padding;
                d2d.DrawLine(this.width-10-textmetrics.width, y+textmetrics.height, this.width-8-4, y+textmetrics.height, colorBrush);
                
                for(const connection of anyconnections) {
                    const r = connection.receiver;
                    if(r) {
                        connection.x = r.source.x+Blueprint.padding-8;
                        connection.y = r.source.y+((r.i+1)*Blueprint.captionHeight+Blueprint.padding);
                    }
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
                    sink.Release();
                    //print(sink.Release(), "sink release?");
                    d2d.DrawGeometry(path, colorBrush, 4, roundStrokeStyle);

                    //d2d.DrawText(`${path.ComputeLength()}`, font, halfX+16, halfY+16, halfX+80, halfY+80, colorBrush);
                    //r&&d2d.DrawText(`${r.id}`, font, halfX+16, halfY+16, halfX+80, halfY+80, colorBrush);
                    //print(path.Release(), "path release?}"); //lowkey idk if this is getting released but idk how to check
                    throwawayObjects.push(path);
                }
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
                const {text, control} = this.parameters[i];
                const tl = text.GetMetrics(); //this.paramText[i].GetMetrics();
                if(withinBounds({x: Blueprint.padding-8-Blueprint.radius-2, y: (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2, width: Blueprint.radius*2+2+tl.width, height: Blueprint.radius*2+2+tl.height}, mouse)) {
                    return [DROP, i];
                }else if(control && !this.connections.in[i]) {
                    //this.x+camera.x+Blueprint.padding+tl.width+8
                    //this.y+camera.y+(i+1)*Blueprint.captionHeight + Blueprint.padding
                                                            //oops i didn't use parethesis here and it was not doing what i expected
                    const ht = control.hittest({x: mouse.x-(Blueprint.padding+tl.width+8), y: mouse.y-((i+1)*Blueprint.captionHeight + Blueprint.padding)});
                    if(ht) {
                        return ht;
                    }
                }
            }
            for(let i = 0; i < this.out.length; i++) {
                const tl = this.out[i].text.GetMetrics(); //this.outText[i].GetMetrics();
                if(withinBounds({x: this.width-8-Blueprint.radius, y: (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2, width: Blueprint.radius*2+2+tl.width, height: Blueprint.radius*2+2+tl.height}, mouse)) {
                    return [DRAG, i];
                }
            }
            return [NULL];
        }
    }

    destroy() {
        //for(let i = 0; i < this.gradientStops.length; i++) {
        //    this.gradientStops[i].Release();
        //    this.gradients[i].Release();
        //}
        for(let i = 0; i < this.gradients.length; i++) {
            this.gradients[i].Release();
        }
        //for(let i = 0; i < this.paramText.length; i++) {
        //    this.paramText[i].Release();
        //}
        //for(let i = 0; i < this.outText.length; i++) {
        //    this.outText[i].Release();
        //}
        for(let i = 0; i < this.parameters.length; i++) {
            const {type, text, control} = this.parameters[i];
            text.Release();
            if(control) {
                control.destroy(); //lol i could've done control?.destroy() but i don't mattedr
            }
        }
        for(let i = 0; i < this.out.length; i++) {
            this.out[i].text.Release();
        }
        panes.splice(panes.indexOf(this), 1);
    }

    preDrag(mouse, data, id) { //act like the id parameter is some fancy overload or something
        //if(this.connections.out[data]) {
        //    const connection = this.connections.out[data];
        //    //connection.receiver.source.connections.in[connection.receiver.i] = undefined; //lowkey convoluted
        //    //connection.x = mouse.x;
        //    //connection.y = mouse.y;
        //}//else {
        //    this.connections.out[data] = {x: mouse.x, y: mouse.y};
        ////}
        if(!this.connections.out[data]) {
            this.connections.out[data] = {}; //not gonna make it an array because then i'd have to push and delete elements and i don't need all that
        }
        
        
        //const i = this.connections.out[data].push({x: mouse.x, y: mouse.y}); //wait i guess i could just pass mouse
        
        //since i've got this basically random number (increments every frame) i'll just use that
        if(!id) {
            if(this.out[data].type == "exec") {
                id = 0;
                //if we pulling an exec pin and it was already connected to something we gotta disconnect that
                if(this.connections.out[data][id]) {
                    const receiver = this.connections.out[data][id].receiver;
                    receiver.source.connections.in[receiver.i] = undefined;
                }
            }else {
                id = draws;
            }
        }
        this.connections.out[data][id] = {x: mouse.x, y: mouse.y};
        activePin = {i: data, source: this, id};
        return this.connections.out[data][id];
    }

    //onDrag() { //implements DraggableObject (if this were a stronger object oriented language)
    //    this.height = h-this.y;
    //}
}

let w = 800;
let h = 600;

const camera = {x: 0, y: 0, zoom: 1}; //idk if im gonna do zoom lowkey but just in case like a reserved parameter...

let panes = []; //not calling it blueprints anymore because i might make additional window types like a custom context menu or like a popup to choose what blueprint to add

function recur(obj, name="") {
    let list = [];
    for(const [key, value] of Object.entries(obj)) {
        if(value instanceof Object && !(value instanceof Blueprint)) {
            list.push(...recur(value, key));
        }else {
            //print(name, key, value.toString());
            list.push({name, key, v: value.toString()});
        }
    }
    return list;
}

function executeBlueprints() {
    //assuming panes[0] is the event start blueprint because it's the first one i make
    const start = panes[0];                                                         //the first 'i' is the index of the out pin (why?)
    let current = start.connections.out[0]?.[0]?.receiver?.source; //connections.out : Array<{i : number, receiver : {i : number, source : Blueprint}}>
    //print(start.connections.out[0]);
    //start.connections.out[0] //we can assume that for every object connected from event start has an exec pin as the first out pin
    //print(recur(start.connections));
    
    const cache = {};
    
    for(const pane of panes) {
        (pane instanceof Blueprint) && (pane._special = false);
    }

    //recur(start.connections);

    function interpretParametersAndExecute(source) { //holy MOlY i just learned the pure functions DON'T cache their result! https://raharuu.github.io/unreal/blueprint-pure-functions-complicated/
        //source._special = false;
        const args = [];
        const notpure = source.type == BPTYPE_NOTPURE;
        const j = notpure ? 1 : 0;
        const paneIndex = panes.indexOf(source);
        let result;
        if(!cache[paneIndex]?.value) {
            for(let i = j; i < source.parameters.length; i++) {
                const param = source.parameters[i];
                let val = 0;
                const cachedData = cache[paneIndex];
                if(!cachedData?.[i]) { //if cachedData is undefined or (?.) if cachedData[i] is undefined
                    if(source.connections.in[i]) {
                        const inpin = source.connections.in[i];
                        //if(inpin.source instanceof Blueprint) { //inpin.source could be a primitive value like true or false (nope nevermind i changed it lol)
                            //const inPaneIndex = panes.indexOf(inpin.source);
                            //const inCachedData = cache[inPaneIndex];
                            //if(!cache[inPaneIndex]) {
                            //    if(inpin.source.type == BPTYPE_PURE) {
                            //        val = globalThis[inpin.source.title](...loopthroughparameters(inpin.source)); //random alternative to eval-ing that i accidently wrote
                            //    }
                            //    cache[inPaneIndex] = val;
                            //}else {
                            //    val = cache[inPaneIndex];
                            //}
                            val = interpretParametersAndExecute(inpin.source);
                        //}
                    }else if(param.control) {
                        val = param.control.value;
                    }
                    //}else if(param == "string") {
                    //    val = "";
                    //}

                    if(notpure) {
                        if(!cachedData) {
                            cache[paneIndex] = {};
                        }
                        cache[paneIndex][i] = val;
                    }
                }else {
                    val = cachedData[i];
                }
                args.push(val);
            }
            //return args;
            //if this is a datatype blueprint then don't do this lmao
            print("exec", source.title);
            print("args", args);
            result = globalThis[source.title](...args);
            if(notpure) {
                if(!cache[paneIndex]) {
                    cache[paneIndex] = {};
                }
                cache[paneIndex].value = result;
                source._special = true;
                dirty = true;
            }
        }else {
            result = cache[paneIndex].value;
        }
        return result;
    }
    
    while(current) {
        //print(current);
        //print("exec", current.title);
        //scan le tree
        //args = loopthroughparameters(current);
        //print("args", args);
        //globalThis[current.title](...args); //store results in cache somehow and make primitive input boxes type shit
        interpretParametersAndExecute(current);
        current = current.connections.out[0]?.[0]?.receiver?.source; //traverse to the next blueprint connected
    }
}

function d2dpaint() {
    d2d.BeginDraw();
    d2d.Clear(0.0, 0.0, 0.0, 0.25);
    //d2d.SetTransform(Matrix3x2F.Translation(camera.x, camera.y));
    //d2d.DrawBitmap(drawing, 0, 0, w, h);
    for(const pane of panes) {
        d2d.SaveDrawingState();
        //oh wait you can't do this d2d.GetTransform().Translation as it returns the straight up D2D1_MATRIX_3X2_F 
        d2d.SetTransform(Matrix3x2F.Translation(pane.x+camera.x, pane.y+camera.y));
        //defaultBGG.SetTransform(Matrix3x2F.Multiply(Matrix3x2F.Translation(pane.x, pane.y), Matrix3x2F.Scale(pane.width/100, pane.height/100, pane.x, pane.y)));
        //defaultBGG.SetTransform(Matrix3x2F.Scale(pane.width, pane.height, 0, 0));
        //d2d.FillRectangle(0, 0, pane.width, pane.height, defaultBGG);
        pane.redraw();
        d2d.RestoreDrawingState();
    }

    //defaultBGG.SetTransform(Matrix3x2F.Identity());
    d2d.EndDraw();

    for(const obj of throwawayObjects) {
        //print(obj.Release(), "throwaway release");
        if((r = obj.Release()) != 0) {
            print(r, "throwaway release");
        }
    }
    throwawayObjects = [];
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC(); ScopeGUIDs(wic);
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        //defaultBGG = d2d.CreateLinearGradientBrush(0,0,1,1,d2d.CreateGradientStopCollection([1.0, 204/255, 204/255, 204/255], [0.0, 178/255, 212/255, 1.0]));
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);
        font = d2d.CreateFont(NULL, 12);
        roundStrokeStyle = d2d.CreateStrokeStyle(D2D1_CAP_STYLE_ROUND, D2D1_CAP_STYLE_ROUND, D2D1_CAP_STYLE_ROUND, D2D1_LINE_JOIN_ROUND, NULL, D2D1_DASH_STYLE_SOLID, 0, D2D1_STROKE_TRANSFORM_TYPE_NORMAL);
        //font.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
        specialBitmap = d2d.CreateBitmapFromWicBitmap(wic.LoadBitmapFromFilename(__dirname+"/../imagine.bmp", wic.GUID_WICPixelFormat32bppPBGRA), true);
        
        gl = createCanvas("gl", NULL, hwnd);
        Blueprint.paramColors["exec"] = [1.0, 1.0, 1.0];
        Blueprint.paramColors["FRAGMENT_SHADER"] = [255/255, 42/255, 0.0];
        Blueprint.paramColors["VERTEX_SHADER"] = [136/255, 255/255, 0.0];
        Blueprint.paramColors["SHADER"] = [200/255, 200/255, 200/255];
        Blueprint.paramColors["string"] = [251/255, 0/255, 209/255];
        Blueprint.paramColors["number"] = [27/255, 191/255, 147/255];
        Blueprint.paramColors["BOOL"] = Blueprint.paramColors.number; //WinAPI's BOOL type is actually just an int
        Blueprint.paramColors["HWND"] = Blueprint.paramColors.number;
        Blueprint.paramColors["boolean"] = [146/255, 0.0, 0.0];
        //DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES
        //uxtheme = DllLoad("UxTheme.dll");
        //print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
        //print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
        //let result = uxtheme("SetWindowTheme", 3, [hwnd, NULL, NULL], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER); //NO FUCKING WAY?!
        //print(result, "result");
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(24, 24, 24)); //hell yeah this shit tuff asf (dark title bar)[doesn't work if you get rid of the window theme tho]
        
        //otherwnd = new BottomPane(hwnd); //no longer blocks the thread as i make and draw every control myself
        //this list is not permanant and im just gonna loop through JBSExtension's extension.ts to get every function and stuff like that
        panes.push(new Blueprint(hwnd, "Event Start", [162/255, 38/255, 30/255], 0, 0, 190, 72, [], [], BPTYPE_EVENT)); //bptype_event adds exec and delegate pin
        panes.push(new Blueprint(hwnd, "SetWindowText", [120/255, 168/255, 115/255], 300, 300, 221, 105, ["window : HWND", "text : string"], ["success : BOOL"], BPTYPE_NOTPURE));
        panes.push(new Blueprint(hwnd, "GetWindowText", [120/255, 168/255, 115/255], 300, 300, 221, 105, ["window : HWND"], ["text : string"], BPTYPE_PURE));
        panes.push(new Blueprint(hwnd, "GetConsoleWindow", [120/255, 168/255, 115/255], 400, 400, 150, 64, [], ["console : HWND"], BPTYPE_NOTPURE));
        panes.push(new Blueprint(hwnd, "FindWindow", [120/255, 168/255, 115/255], 400, 400, 150, 90, ["className? : string", "windowTitle : string"], ["window : HWND"], BPTYPE_PURE));
        panes.push(new Blueprint(hwnd, "version", [251/255, 0/255, 209/255], 400, 400, 150, 64, [], ["version : string"], BPTYPE_PURE));
        panes.push(new Blueprint(hwnd, "Program", [95/255, 150/255, 187/255], 300, 100, 221, 90*2, ["fragmentShader : FRAGMENT_SHADER", "vertexShader : VERTEX_SHADER"], [], BPTYPE_NOTPURE));
        panes.push(new Blueprint(hwnd, "Shader", [120/255, 168/255, 115/255], 0, 100, 221, 90, ["filename : string", "type : number"], ["shader : SHADER"], BPTYPE_PURE));
        panes.push(new Blueprint(hwnd, "print", [95/255, 150/255, 187/255], 500, 500, 150, 90, ["In String : string"], [], BPTYPE_NOTPURE));
        panes.push(new Blueprint(hwnd, "Beep", [120/255, 168/255, 115/255], 100, 500, 200, 130, ["frequency : number", "durationMs : number", "nonblocking? : boolean"], ["success : BOOL"], BPTYPE_NOTPURE));
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
        mouse.x -= camera.x;
        mouse.y -= camera.y;
        //let result = 0;
        hit = {};
        //hitpane = undefined;
        for(const pane of panes) {
            if(withinBounds(pane, mouse)) {
                //hitpane = undefined;

                const clientmouse = {x: mouse.x-pane.x, y: mouse.y-pane.y};
                //mouse.x -= pane.x;
                //mouse.y -= pane.y; //to client (oops i was directly modifying mouse)
                const [legit, data] = pane.hittest(clientmouse);
                //hit |= legit; //lowkey i was just OR ing them together to make it easier
                //if(legit != 0) {
                    hit.result = legit;
                    hit.pane = pane;
                    if(legit) {
                        //hitpane = legit == BUTTON ? data : pane;
                        hit.data = data;
                    }
                //}
            }
        }
        for(const [flag, cursor] of hittestarr) {
            //if((hit & flag) == flag) {
            if(hit.result == flag) { //i had to change hit to be only one value because if the topmost pane set TOP and a pane below set MOVE, it would use MOVE because it was the last element of hittestarr (wait a second that's not even the current problem)
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
                hit.data.buttonDown(mouse);
                activeButton = hit.data;
            }else //if((hit.result & MOVE) == MOVE) {
            if(hit.result == MOVE) {
                Draggable.select(hit.pane, mouse, false, false);
            }else if(hit.result == CONTEXTMENU) {
                //no
            }else if(hit.result == DRAG) {
                if(GetKey(VK_MENU)) {
                    const anyoutconnections = Object.values(hit.pane.connections.out[hit.data] ?? {});
                    if(anyoutconnections.length) {
                        for(const connection of Object.values(anyoutconnections)) {
                            const out = connection.receiver;
                            out.source.connections.in[out.i] = undefined;
                        }
                    }
                    hit.pane.connections.out[hit.data] = undefined;
                }else {
                    Draggable.select(hit.pane.preDrag?.(mouse, hit.data) ?? hit.pane, mouse, false, false);
                }
            }else if(hit.result == DROP) {
                print(hit.data);

                const inpin = hit.pane.connections.in[hit.data]; //{i, source, id}
                if(inpin) {
                    if(GetKey(VK_MENU)) {
                        delete inpin.source.connections.out[inpin.i][inpin.id];
                        hit.pane.connections.in[hit.data] = undefined;
                    }else {
                        const {i, source, id} = inpin;
                        hit.pane.connections.in[hit.data] = undefined;
                        Draggable.select(source.preDrag?.(mouse, i, id) ?? source, mouse, false, false);
                    }
                }
            }else if(hit.result == TEXT) {
                Editable.beginInput(hit.data[0], hit.data[1]); //haha i made hit.data = [i, object]
            }
            else {
                //const updown = ((hit.result & TOP) == TOP) || ((hit.result & BOTTOM) == BOTTOM);
                const updown = hit.result == TOP || hit.result == BOTTOM;
                Draggable.select(hit.pane, mouse, updown, !updown);
            }
        }

        for(const pane of panes) {
            if(pane.x <= mouse.x && pane.y <= mouse.y) {
                mouse.x -= pane.x;
                mouse.y -= pane.y; //to client
                //hit |= pane.hittest(mouse);
                pane.mouseDown?.(mouse);
            }
        }

        if(hit.result != TEXT && Editable.editing) {
            Editable.endInput();
        }
    }else if(msg == WM_RBUTTONDOWN) {
        const mouse = {x: GET_X_LPARAM(lp)-camera.x, y: GET_Y_LPARAM(lp)-camera.y}; //lp is client mouse pos

        if(hit.result == BUTTON) {
            hit.pane.buttonRightMouseDown?.(mouse);
        }else if(hit.result == CONTEXTMENU) {
            const screenmousepos = GetCursorPos();
            hit.pane.preContextMenu?.(screenmousepos);
            TrackPopupMenu(hit.pane.contextMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, screenmousepos.x, screenmousepos.y, hwnd);
        }

        for(const pane of panes) {
            if(pane.x <= mouse.x && pane.y <= mouse.y) {
                mouse.x -= pane.x;
                mouse.y -= pane.y; //to client
                //hit |= pane.hittest(mouse);
                pane.rightMouseDown?.(mouse);
            }
        }
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture();
        Draggable.mouseUp();

        const mouse = {x: GET_X_LPARAM(lp)-camera.x, y: GET_Y_LPARAM(lp)-camera.y}; //lp is client mouse pos
        //if(hit == BUTTON) {
        //    hitpane.mouseUp(mouse);
        //}
        if(activeButton) {
            activeButton.buttonUp?.(mouse);
            dirty = true;
        }
        if(activePin) {
            //print(hit);
            //dang it bruh WM_SETCURSOR doesn't fire when holding the mouse down and so hit.pane is still/actually activePin.source
            let receiver;
            for(const pane of panes) {
                if(withinBounds(pane, mouse)) {
                    //hitpane = undefined;
    
                    const clientmouse = {x: mouse.x-pane.x, y: mouse.y-pane.y};
                    //mouse.x -= pane.x;
                    //mouse.y -= pane.y; //to client (oops i was directly modifying mouse)
                    const [legit, data] = pane.hittest(clientmouse);
                    if(legit == DROP) {
                        receiver = {i: data, source: pane};
                    }
                }
            }    
    
            if(receiver) {
                                            //boy this is looking confusing...
                activePin.source.connections.out[activePin.i][activePin.id].receiver = receiver; //{i: receiver.data, source: receiver.blueprint};
                const receiverpin = receiver.source.connections.in[receiver.i]; //{i, source, id}
                if(receiverpin) { //if A was connected to B and C wants to connect to B, then i tell A that it's no longer connected
                    //this happens when something is already connected and you connect ANOTHER thing to this one
                    //receiverpin.source.connections.out[receiverpin.i] = undefined; //receiverpin.i (i think?)
                    delete receiverpin.source.connections.out[receiverpin.i][receiverpin.id];
                }
                receiver.source.connections.in[receiver.i] = activePin; //.source = activePin;
                //print(activePin.i, receiver.i);
            }else {
                //if(activePin.source.connections.out[activePin.i]?.receiver) { //moved into preDrag
                //    const receiver = activePin.source.connections.out[activePin.i].receiver;
                //    receiver.source.connections.in[receiver.i] = undefined;
                //    print(activePin.i, "prev", receiver.i);
                //}
                delete activePin.source.connections.out[activePin.i][activePin.id];// = undefined;
            }
        }
        activePin = undefined;
        activeButton = undefined;


        for(const pane of panes) {
            if(pane.x <= mouse.x && pane.y <= mouse.y) {
                mouse.x -= pane.x;
                mouse.y -= pane.y; //to client
                //hit |= pane.hittest(mouse);
                pane.mouseUp?.(mouse);
            }
        }
    }else if(msg == WM_COMMAND) {
        if(hit.result == CONTEXTMENU) { //mango
            hit.pane.onCommand(wp, lp);
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
        }else if(wp == "T".charCodeAt(0)) {
            //const dbg = d2d.DXGIGetDebugInterface1();
            //print(d2d.DXGI_DEBUG_ALL);
            //dbg.ReportLiveObjects(d2d.DXGI_DEBUG_ALL, DXGI_DEBUG_RLO_ALL); //dang it bruh this only logs d3d and dxgi related object (no d2d)
            //dbg.Release();
        }else if(wp == " ".charCodeAt(0)) {
            if(GetKey(VK_SHIFT)) {
                executeBlueprints();
            }
        }

        if(wp == VK_ESCAPE) {
            Editable.endInput();
        }
        if(Editable.editing && (wp > VK_SPACE || wp <= VK_DELETE)) {
            Editable.modify(wp);
        }
    }else if(msg == WM_CHAR) {
        if(Editable.editing && (wp != VK_RETURN && wp != VK_BACK && wp != 127)) { //for some reason ctrl+backspace puts this random character down (and windows controls always put it instead of backspacing words and it makes me mad)
            print("char", wp, String.fromCharCode(wp));
            Editable.writechar(String.fromCharCode(wp));
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
        for(const pane of panes) {
            pane.destroy();
        }
        print(font.Release());
        print(colorBrush.Release());
        print(roundStrokeStyle.Release());
        print(d2d.Release());
        print(wic.Release());
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

    //for(const pane of panes) {
    //    if(pane.x <= mouse.x && pane.y <= mouse.y) {
    //        mouse.x -= pane.x;
    //        mouse.y -= pane.y; //to client
    //        //hit |= pane.hittest(mouse);
    //        pane.windowProc(hwnd, msg, wp, lp);
    //    }
    //}
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = arrow;//NULL; //LoadCursor(NULL, IDC_ARROW); //im using NULL here because im changing SetCursor myself here (nevermind i stopped using NULL because i handle the WM_SETCURSOR event and when i don't change the cursor i have DefWindowProc do the work)

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "unreal blueprints for jbs?", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);