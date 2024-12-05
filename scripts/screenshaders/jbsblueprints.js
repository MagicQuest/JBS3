//imma be honest the code that goes into drawing and managing the blueprints might not be good BUT IT WORKS
//i might try to clean this shit up at some point so it's not a tangled mess of classes

//stop Sleep and SET from being cached !!! (actually i think if current is the one being interpreted it should be executed every time? also when caching in a loop, store the cached values in loopStack.at(-1) so when it repeats i clear that cache! I think it true that this may be a valid alternative for the cacheable property and this line as a whole. )
//test if unreal still caches unpure function connected to a while condition or something (yeah nah if you connect an unpure function to a while loop in unreal it'll tell you there's an infinite loop)
//probably should make a modal class or something like that for BlueprintMenu and DropdownControlMenu
//quite possibly make static functions for managing pin connections because BOY is it confusing
//make some animation class or global array like magicquest.github.io/v2 !

//const rp = print;
//print = function(...args) {};

let wic, d2d, font, colorBrush, roundStrokeStyle, specialBitmap;

let dirty = false;
let hit = {}; // {result, pane, data}
//let hitpane;
let activeButton;
let activePin; //{i, source, id}
//let activePane;
let draws = 0;
let throwawayObjects = [];

let next; //next blueprint to fire (global so i can change it in the meta functions like branch/IF)
let loopStack = [];

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

const TOP = 0b00000000001;
const LEFT = 0b00000000010;
const RIGHT = 0b00000000100;
const BOTTOM = 0b00000001000;
const BUTTON  = 0b00000010000;
const MOVE     = 0b00000100000;
const CONTEXTMENU=0b00001000000;
const DROP        =0b00010000000;
const DRAG         =0b00100000000;
const TEXT          =0b01000000000;
const WHEEL          =0b10000000000;

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
    [WHEEL, LoadCursor(NULL, 32652)], //idk why 32652 isn't named
];

const BPTYPE_PURE = 0;
const BPTYPE_NOTPURE = 1;
const BPTYPE_EVENT = 2;
const BPTYPE_BARE = 3;

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
        if(object != camera && object instanceof Blueprint) { //lol i want blueprints to still be selected when dragging the camera
            Blueprint.active = object; //apparently this is the ONLY time i set Blueprint.active which is kinda weird but i guess not that weird
            //if(activePane instanceof Blueprint) {
                PropertyMenu.addFunctionDetails(); //hell yeah borhter
            //}
        }
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

class Editable { //for text :smirk: (unfortunately you must draw the text and caret yourself)
    static caret = 0;
    static editing = false;
    static edited = undefined;
    static returntoquit = true;

    static ctrlDelimiters = [".", " "]; //points where using ctrl+backspace/delete will stop
    //static ctrlDelimiters = /[."]/;

    static beginInput(caret = 0, tobeedited, returntoquit = true) { //named like roblox's UserInputService (oh i just googled it and it's actually inputBegan im a FRAUD)
        if(Editable.editing && tobeedited != Editable.edited) Editable.endInput();
        Editable.caret = caret;
        Editable.edited = tobeedited;
        Editable.edited.value = Editable.edited.value?.toString() ?? "undefined"; //just in case lol
        Editable.editing = true;
        Editable.returntoquit = returntoquit;
        print("HELL YEAH BEGIN INPUT");
        print("value:", tobeedited.value);
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
        //for(let j = Editable.caret+1; j < Editable.edited.value.length; j++) { //plus one here to skip the possible delim in front
        //    for(const delim of Editable.ctrlDelimiters) {
        //        if(Editable.edited.value[j] == delim) {
        //            //print("delim nigga", j, Editable.edited.value[j], delim);
        //            const count = j-(Editable.caret+1);
        //            //break; //god damn it i swear in js break would work in nested loops
        //            //break bruh;
        //            return count;
        //        }
        //    }
        //    if(j == Editable.edited.value.length) {
        //        return (Editable.caret+1)-j;
        //    }
        //}
        //return Editable.edited.value.length-(Editable.caret+1);
        for(const delim of Editable.ctrlDelimiters) {
            const index = Editable.edited.value.indexOf(delim, Editable.caret+1); //plus one here so if the caret is on a space we skip it
            if(index != -1) {
                return index-(Editable.caret+1);
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
        //if(GetKey(VK_CONTROL) && char == "a") { //why is char String.fromCharCode(1) when you hit control a
        //    //lowkey idk about highlighting like that so im just moving the caret
        //    return;
        //}
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

//yeah PrimitiveControl is totally deprecated and im only using it for validPrimitives now
class PrimitiveControl { //hell yeah brother (this object isn't meant to be on its own and is for Blueprint but i also use it in BlueprintMenu too)
    static validPrimitives = {string: [PRIMITIVE_INPUT], number: [PRIMITIVE_INPUT, "number"], bigint: [PRIMITIVE_INPUT, "bigint"], boolean: [PRIMITIVE_TOGGLE], BOOL: [PRIMITIVE_TOGGLE], float: [PRIMITIVE_INPUT, "float"]};

    /*type = PRIMITIVE_TOGGLE;
    value = undefined;
    data = undefined; //data for PRIMITIVE_DROPDOWN or the type of number for PRIMITIVE_INPUT
    geometry = undefined; //random additional d2d stuff like a path geometry (for toggle) or a text layout (for input)
    width = 16;
    height = 16;

    constructor(x, y, type, data) {
        this.type = type;
        this.data = data;

        if(this.type == PRIMITIVE_TOGGLE) {
            this.geometry = d2d.CreatePathGeometry();
            const sink = this.geometry.Open();
            sink.BeginFigure(x+4, y+9, D2D1_FIGURE_BEGIN_HOLLOW); //lowkey just looked a picture of a checked boolean parameter
            sink.AddLine(x+7, y+11);
            sink.AddLine(x+13, y+5);
            sink.EndFigure(D2D1_FIGURE_END_OPEN);
            sink.Close();
            sink.Release();

            this.value = 0;
        }else if(type == PRIMITIVE_INPUT) {
            if(data == "number" || data == "float") {
                this.value = 0;
            }else {
                this.value = "";
            }
            this.geometry = d2d.CreateTextLayout(this.value, font, 100, 16);
        }
    }

    redraw(x, y) {
        if(this.type == PRIMITIVE_TOGGLE) {
            colorBrush.SetColor(.3, .3, .3);
            d2d.FillRoundedRectangle(x, y, x+16, y+16, 2, 2, colorBrush);
            colorBrush.SetColor(1.0, 1.0, 1.0);
            if(this.value) {
                d2d.DrawGeometry(this.geometry, colorBrush, 2); //no round stroke style for htis one
            }
            d2d.DrawRoundedRectangle(x, y, x+16, y+16, 2, 2, colorBrush, 2, roundStrokeStyle);
        }else if(this.type == PRIMITIVE_INPUT) {
            //damn i might have to draw the caret myself in here
            if(this.geometry.text != this.value) { //haha just now added this property
                const {widthIncludingTrailingWhitespace} = this.geometry.GetMetrics(); //wait why the hell did i get the width BEFORE i changed the value? (there's either a valid reason or i was TWEAKING)
                this.geometry.Release();
                this.geometry = d2d.CreateTextLayout(this.value, font, 100, 16);
                this.width = Math.max(16, 16+widthIncludingTrailingWhitespace);
            }
            
            if(Editable.edited == this) {
                //const t = d2d.CreateTextLayout(this.value.slice(0, Editable.caret), font, 100, 16);
                //const {widthIncludingTrailingWhitespace} = t.GetMetrics(); //if there are trailing spaces it doesn't show that and it's weird

                
                const hit = this.geometry.HitTestTextPosition(Editable.caret, false); //who knew this function's main purpose was this use case
                //print(hit.x, hit.hitTestMetrics.width);
                const caretX = hit.x+2+x; //plus 2 because im drawing the text 2 pixels away from 0
                const caretY = hit.y+y;

                
                //const pos = ; //lowkey might have to make a text layout to see how wide each character is
                d2d.DrawLine(caretX, caretY, caretX, caretY+16, colorBrush, 1, roundStrokeStyle);
                //t.Release();
            }
            d2d.DrawRoundedRectangle(x, y, x+this.width, y+16, 2, 2, colorBrush, 1, roundStrokeStyle);
            d2d.DrawTextLayout(2+x, y, this.geometry, colorBrush); //lowkey i bet i could totally make the text scroll if you type too much but i ain't doing that rn
        }
    }

    buttonDown(mouse) {
        if(this.type == PRIMITIVE_TOGGLE) {
            this.value = !this.value;
        }
    }

    endInput() {
        if(this.type == PRIMITIVE_INPUT) {
            if(this.value == "NULL" || this.value == "null" || this.value == "undefined"){
                this.value = undefined;
            }else if(this.data == "number") {
                this.value = Number(this.value) || 0; //NaN is falsy but not nullish (no nullish coalescing today)
            }else if(this.data == "float") {
                this.value = parseFloat(this.value) || 0.0;
            }
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
    }*/
}

class StaticControl {
    width = 100;
    height = 16;
    value = "Sample Text";
    color = [1.0, 1.0, 1.0];

    constructor(width = 100, height = 16, value = "Sample Text", color = [1.0, 1.0, 1.0]) {
        this.width = width;
        this.height = height;
        this.value = d2d.CreateTextLayout(value, font, this.width, this.height);
        this.color = color;
    }

    redraw(x, y) {
        colorBrush.SetColor(...this.color);
        d2d.DrawTextLayout(x, y, this.value, colorBrush);
    }

    hittest(mouse, x, y) {

    }

    destroy() {
        this.value.Release();
    }
}

class WatchStaticControl extends StaticControl {
    constructor(width, height, object, property, color) {
        super(width, height, object[property], color);
        this.object = object;
        this.property = property;
    }

    redraw(x, y) {
        if(this.object[this.property] != this.value.text) {
            this.value.Release();
            this.value = d2d.CreateTextLayout(this.object[this.property], font, this.width, this.height);
        }
        super.redraw(x, y);
    }
}

class CheckboxControl {
    width = 16;
    height = 16;
    value = false;
    callback = undefined;
    geometry = undefined;

    constructor(width = 16, height = 16, value = false, callback) {
        this.width = width;
        this.height = height;
        this.value = value;
        this.callback = callback?.bind(this);

        this.geometry = d2d.CreatePathGeometry();
        const sink = this.geometry.Open();
        sink.BeginFigure(4, 9, D2D1_FIGURE_BEGIN_HOLLOW); //lowkey just looked a picture of a checked boolean parameter in unreal
        sink.AddLine(7, 11);
        sink.AddLine(13, 5);
        sink.EndFigure(D2D1_FIGURE_END_OPEN);
        sink.Close();
        sink.Release();
    }

    buttonDown(mouse) {
        this.value = !this.value;
        this.callback?.();
    }

    redraw(x, y) {
        colorBrush.SetColor(.3, .3, .3);
        d2d.FillRoundedRectangle(x, y, x+this.width, y+this.height, 2, 2, colorBrush);
        colorBrush.SetColor(1.0, 1.0, 1.0);
        if(this.value) {
            //oof
            const prev = d2d.GetTransform(); //i should be able to just do prev.Translation() or something so i can add it so i might have to add that
            const copy = Object.assign({}, prev); //hell yeah brother next best thing to structuredClone
            //print(copy);
            //copy.dx += x; //i mean probably dawg unfortunately matrices are outta my league currently
            //copy.dy += y;
            ////oops wrong properties
            //copy.m[2][0] += x;
            //copy.m[2][1] += y;
            copy._31 += x; //ok idk why Matrix3x2F has so many useless properties since this is the only one i had to change
            copy._32 += y;
            //print(copy, "POST COPY");
            d2d.SetTransform(copy);
            d2d.DrawGeometry(this.geometry, colorBrush, 2); //no round stroke style for htis one
            d2d.SetTransform(prev);
        }
        d2d.DrawRoundedRectangle(x, y, x+this.width, y+this.height, 2, 2, colorBrush, 2, roundStrokeStyle);
    }

    hittest(mouse, x, y) {
        if(withinBounds({x, y, width:this.width, height:this.height}, mouse)) {
            return [BUTTON, this];
        }
    }

    destroy() {
        this.geometry.Release();
    }
}

class DropdownControlMenu { //a singleton for controls that need a dropdown (dropdown as in the way i use it in shadereditor2.js)
    //the reason i need a whole new class/pane for this is because if i drew the entire dropdown in an individual dropdown control (like i was doing in shadereditor2.js) and i had another control **right below** the dropdown then the hittest would (probably) go off of (oh fuck! right as i was writing this part i just realized that my assumptions were wrong and techincally i didn't have to make this class (im gonna keep it though because it'll probably help me))
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    rowHeight = 16;
    options = [];
    sticky = true; //OHHHH ("it's getting sticky in this bitch")
    static instance = undefined;

    static open(x, y, options, callback, width = 0) {
        if(this.instance) {
            this.close();
        }
        //this.instance.x = x; //this as in DropdownControlMenu (static)
        //this.instance.y = y;
        //this.instance.options = options;
        if(!width) {
            //we calculating it manually
            const longeststr = options.toSorted((a, b) => b.length-a.length)[0];
            const temp = d2d.CreateTextLayout(longeststr, font, w, h);
            width = temp.GetMetrics().width+4; //i might have to make a d2d.GetMetricsForText(text, font, maxwidth, maxheight)
            temp.Release();
        }
        if(x+width > w) {
            x -= (x+width)-w;
        }
        //this.instance.width = width;
        this.instance = new DropdownControlMenu(x, y, options, callback, width);
        this.instance.height = options.length*this.instance.rowHeight; //just in case i decide to change rowHeight
        //this.instance.width = ;//calc is short for calculator im just using slang
        panes.push(this.instance);
        //this.instance.height = 16; //propbbaly
    }

    constructor(x, y, options, callback, width) {
        this.x = x;
        this.y = y;
        for(const option of options) {
            this.options.push(d2d.CreateTextLayout(option, font, w, h)); //this.options is by default an empty array []
        }
        //this.options = options;
        this.width = width;
        //this.height = height;
        this.callback = callback;
    }

    redraw() {
        //const dropdownheight = control.height/(control.args.length+1); //lol
        // /mangomangomango/gymuisd
        colorBrush.SetColor(0xffffff); //nice :)
        d2d.FillRectangle(0, 0, this.width, this.height, colorBrush);
        for(let i = 0; i < this.options.length; i++) {
            const y = i*this.rowHeight;
            colorBrush.SetColor(0.0, 0.0, 0.0);
            d2d.DrawRectangle(0, y, this.width, y+this.rowHeight, colorBrush, 1, roundStrokeStyle);
            //colorBrush.SetColor(1.0, 1.0, 1.0);
            //d2d.FillRectangle(control.x+textwidth, control.y+(i+1)*dropdownheight, control.x+control.width, (control.y+(i+1)*dropdownheight)+dropdownheight, colorBrush);
            //colorBrush.SetColor(0.0, 0.0, 0.0);
            d2d.DrawTextLayout(0, y, this.options[i], colorBrush);
            //d2d.DrawText(this.options[i], font, 0, y, w, h, colorBrush);
        }
    }

    hittest(mouse) {
        for(let i = 0; i < this.options.length; i++) {
            if(withinBounds({x: 0, y: i*this.rowHeight, width: this.width, height: this.rowHeight}, mouse)) {
                const tempobjectthatmakesmecringe = { //this is weird but valid i guess lol
                    buttonDown: function(mouse) {
                        //using DropdownControlMenu.instance because i can't bothered to bind(this)
                        DropdownControlMenu.instance.callback(DropdownControlMenu.instance.options[i].text); //.text because they are now TextLayouts
                        DropdownControlMenu.close();
                    },
                };
                return [BUTTON, tempobjectthatmakesmecringe]; //should probably make a callback version but i did it like this because yk
            }
        }
        return [NULL];
    }

    static close() {
        //print("Close DropdownControlMenu");
        this.instance.destroy();
        this.instance = undefined;
    }

    destroy() {
        //idk yet hold on.
        for(const option of this.options) {
            option.Release(); //oops forgot that
        }
        panes.splice(panes.indexOf(this), 1);
    }
}

class EditControl {
    width = 24;
    height = 16;
    value = "";
    data = undefined;
    layout = undefined;
    endInput = undefined;
    autoresize = false;
    maxwidth = 100;

    verifyInput() {
        if(this.value == "NULL" || this.value == "null" || this.value == "undefined"){
            this.value = undefined;
        }else if(this.data == "number") {
            this.value = Number(this.value) || 0; //NaN is falsy but not nullish (no nullish coalescing today)
        }else if(this.data == "float") {
            this.value = parseFloat(this.value) || 0.0;
        }else if(this.data == "bigint") {
            this.value = BigInt(this.value) || 0n;
        }
        this.updateText();
    }

    constructor(width, height, data, value, endInput) {
        this.layout = d2d.CreateTextLayout(value, font, w, h); //OOHHHH
        this.endInput = endInput?.bind(this) ?? this.verifyInput;
        this.width = width;
        this.height = height;
        this.data = data;
        //if(!value) {
        //    if(data) {
        //        this.verifyInput();
        //    }else {
        //        this.value = "";
        //    }
        //}else {
        //    this.value = value; //CHANGING VALUE DOWN HERE CAUSES REDRAW TO UPDATE THE SIZE SINCE IT'S DIFFERENT!
        //}
        this.value = value ?? "";
        this.verifyInput();
    }

    updateText() {
        //print(this.layout.text, this.value); //wait what the fuck why does this.layout.text give me the actual boolean value instead of a string (yeah oops i was trolling on the v8 side)
        //if(this.layout.text !== this.value) { //OH MY GOD THIS IS THE FIRST TIME I'VE EVER NEEDED TO USE A STRICT OPERATOR BECAUSE I NEED TO TELL THE DIFFERENCE BETWEEN false AND 0!!!!!!
        if(this.layout.text !== this.value) { //NEVERMIND I STILL HAVE TO USE IT ANYWAYS BECAUSE THE STRING "0x14" IS BEING COALESCED INTO A NUMBER (20) SO THE COMPARISON "0x14" != 20 IS FALSE!
            this.layout.Release();
            this.layout = d2d.CreateTextLayout(this.value, font, this.maxwidth, 16); //100, 16);
            if(this.autoresize) {
                const {widthIncludingTrailingWhitespace} = this.layout.GetMetrics();
                this.width = Math.max(24, 16+widthIncludingTrailingWhitespace);
            }
        }
    }
    
    redraw(x, y) {
        //const halfwidth = PropertyMenu.instance.width/2;
        colorBrush.SetColor(0xcccccc);
        d2d.FillRoundedRectangle(x, y, x+this.width-4, y+this.height, 2, 2, colorBrush);
        colorBrush.SetColor(229/255, 229/255, 229/255);
        d2d.DrawRoundedRectangle(x, y, x+this.width-4, y+this.height, 2, 2, colorBrush, 2, roundStrokeStyle); //gotta subtract 4 because of the 2 strokewidth

        this.updateText();

        colorBrush.SetColor(0.0, 0.0, 0.0);
        
        if(Editable.edited == this) {
            //const t = d2d.CreateTextLayout(this.value.slice(0, Editable.caret), font, 100, 16);
            //const {widthIncludingTrailingWhitespace} = t.GetMetrics(); //if there are trailing spaces it doesn't show that and it's weird

            
            const hit = this.layout.HitTestTextPosition(Editable.caret, false); //who knew this function's main purpose was this use case
            //print(hit.x, hit.hitTestMetrics.width);
            const caretX = hit.x+x; //plus 4 because im drawing the text 4 pixels away from 0
            const caretY = hit.y+y;

            
            //const pos = ; //lowkey might have to make a text layout to see how wide each character is
            d2d.DrawLine(caretX, caretY, caretX, caretY+16, colorBrush, 1, roundStrokeStyle);
            //t.Release();
        }
        d2d.DrawTextLayout(x, y, this.layout, colorBrush);    
    }

    hittest(mouse, x, y) {
        //const halfwidth = PropertyMenu.instance.width/2;
        if(withinBounds({x, y, width: this.width, height: this.height}, mouse)) {
            const i = this.layout.HitTestPoint(mouse.x-x, mouse.y).hitTestMetrics.textPosition;
            return [TEXT, [i, this]];
        }
        //no return NULL here because im doing it specially (which is weird)
        //(i mean that i use return [NULL] at the end of PropertyMenu's hittest if nothing was hit)
    }

    destroy() {
        //this.name.Release();
        this.layout.Release();
    }
}

class DropdownButtonControl {
    options = [];
    callback = undefined; 
    value = undefined;
    width = 0;
    height = 0;

    constructor(width, height, options, value, callback) {
        this.options = options;
        this.callback = callback;
        this.value = value ?? options[0];
        this.width = width;
        this.height = height;
    }

    onEdit(newvalue) {
        //print("binf this idk?", this.options); //apparently i didn't have to bind rthis (ok no i lied without bind(this), this function is bound to DropdownControlMenu!)
        //print(this instanceof DropdownButtonControl, newvalue);
        this.value = newvalue;
        this.callback?.(newvalue);
    }

    buttonDown(mouse) {
        //i wasn't originally planning on using mouse.x and mouse.y but it works good enough lmao
        //oh shoot mouse isn't screenspace lemme fix that
        DropdownControlMenu.open(mouse.x+camera.x, mouse.y+camera.y, this.options, this.onEdit.bind(this));
    }
    
    redraw(x, y) {
        colorBrush.SetColor(0.0, 0.0, 0.0);
        d2d.DrawRoundedRectangle(x, y, x+this.width-4, y+this.height, 1, 1, colorBrush, 2, roundStrokeStyle);
        colorBrush.SetColor(229/255, 229/255, 229/255);
        d2d.FillRoundedRectangle(x, y, x+this.width-4, y+this.height, 1, 1, colorBrush);
        colorBrush.SetColor(0.0, 0.0, 0.0);
        d2d.DrawText(this.value, font, x, y, w, h, colorBrush);
    }

    hittest(mouse, x, y) {
        if(withinBounds({x, y, width: this.width, height: this.height}, mouse)) {
            return [BUTTON, this];
        }
    }

    destroy() {
        
    }
}

function createControlBasedOnType(type, width, height, ...args) {
    const [primitivetype, additional] = PrimitiveControl.validPrimitives[type];
    if(primitivetype == PRIMITIVE_TOGGLE) {
        return new CheckboxControl(width, height, ...args);
    }else if(primitivetype == PRIMITIVE_INPUT) {
        return new EditControl(width, height, additional, ...args); //[specil]
    }else if(primitivetype == PRIMITIVE_DROPDOWN) {
        return new DropdownButtonControl(width, height, ...args);
    }
}

const baseTypes = {
    HWND: "number",
    DWORD: "number",
    SHORT: "number",
    HMENU: "number",
    BOOL: "number",
    HDC: "number",
    HBITMAP: "number",
    HBRUSH: "number",
    HFONT: "number",
    HPEN: "number",
    HRGN: "number",
    HICON: "number",
    RGB: "number",
    COLORREF: "number",
    HGDIOBJ: "number",
    HCURSOR: "number",
    HANDLE: "number",
    LRESULT: "number",
    HRESULT: "number",
    HMODULE: "number",
    FARPROC: "number",
    NTSTATUS: "number",
    HKEY: "number",

    wstring: "string",
}

class Blueprint {
    static paramColors = {};
    static defaultColor = [.8, .8, .8];
    //static captionHeight = GetSystemMetrics(SM_CYCAPTION) + GetSystemMetrics(SM_CYEDGE)*2; //27
    static captionHeight = 21;

    parent = NULL;
    title = "";
    x = 0;
    y = 0;
    width = 256;
    height = 100;
    parameters = []; //i JUST realized that parameters should be an array of objects {type, text, control?}
    out = []; //{type, text}
    type = BPTYPE_PURE;

    //gradientStops = [];
    gradients = [];
    //paramText = []; //efficientcy
    //outText = [];

    connections = {
        in: [], //Array<{i, source, id}> (if param 0 is an exec pin then in[0] is an object instead)
        out: [] //Array<{{key: {receiver : {i, source, id?}}}>
    };

    static padding = 16;
    static radius = 4;

    static meta_functions = {};
    static variables /*: {type : string, textlayout : IDWriteTextLayout, defaultvalue : any}*/ = {};

    static active = undefined; //the currently selected blueprint

    /*static*/selectionGradient = undefined;

    static recreate(old, cl) {
        old.destroy();

        const {name, desc, parameters, out, type} = cl;
        //print(typeof(parameters), typeof(out));
        print("RECREATING", name, desc, parameters, out, type);
        const newbp = Blueprint.create(undefined, name, old.x, old.y, parameters, out, type ?? BPTYPE_NOTPURE, desc); //ok putting undefined here is a real sign that i really don't need to hold on to the hwnd in Blueprint lmao                
        //newbp.connections = Object.assign({}, old.connections); //doudou oye
        let m = 0;
        if(old.type != type) {
            if(type == BPTYPE_PURE) {
                m = 1;
            }else {
                m = -1;
            }
        }
        for(let l = 0; l < newbp.parameters.length; l++) {
            const {control} = newbp.parameters[l];
            if(control) {
                //print(l, old.parameters[l]);
                control.value = old.parameters[l+m].control.value;
            }
        }
        //for(let l of Object.keys(newbp.connections.in)) { //lowkey for some reason the regular for wasn't working so i used this instead and now im tryna figure out why it wasn't working in the first place
        //looping through old connections because this new blueprint could have more or less connections
        //let maxinlength = newbp.connections.in.length;
        //if(maxinlength > old.connections.in.length) {
        //    maxinlength = old.connections.in.length;
        //}
        //let n = 0;
        //basically if type == BPTYPE_PURE then let l = 0 else let l = 1
        for(let l = 0; l < old.connections.in.length; l++) { //i think i accidently put i++ the first time or something!
            //print("l",l);
            if(old.type != type) {
                //using the old blueprint here so i can get rid of the thingy yk
                if(type == BPTYPE_PURE && l == 0) {
                    const pconnections = old.connections.in[l]; //{i, source, id}
                    if(pconnections) {
                        for(const key of Object.keys(pconnections)) {
                            const pin = pconnections[key];
                            if(pin) delete pin.source.connections.out[pin.i][pin.id];
                        }
                    }
                    //n = 1;
                    continue;
                }
            }
            const oldpin = old.connections.in[l];
            if(oldpin) {
                newbp.connections.in[l-m] = oldpin;
                const maybepin = newbp.connections.in[l-m];
                if(newbp.parameters[l-m].type == "exec") {
                    for(const key of Object.keys(maybepin)) {
                        const pin = maybepin[key];
                        pin.source.connections.out[pin.i][pin.id].receiver.i = l-m; //bruh......
                        pin.source.connections.out[pin.i][pin.id].receiver.source = newbp; //bruh......    
                    }
                }else {
                    maybepin.source.connections.out[pin.i][pin.id].receiver.i = l-m; //bruh...
                    maybepin.source.connections.out[pin.i][pin.id].receiver.source = newbp; //bruh...
                }
            }
        }
        //let maxoutlength = newbp.connections.out.length;
        //if(maxoutlength > old.connections.out.length) {
        //    maxoutlength = old.connections.out.length;
        //}
        //n = 0;
        //basically if type == BPTYPE_PURE then let l = 0 else let l = 1
        for(let l = 0; l < old.connections.out.length; l++) {
            //const pin = newbp.connections.out[i];
            for(const key in old.connections.out[l]) {
                if(old.type != type) {
                    if(type == BPTYPE_PURE && l == 0) {
                        const pin = old.connections.out[l][key]; //receiver : {i, source}
                        //if(pin) pin.receiver.source.connections.in[pin.receiver.i] = undefined;
                        if(pin) delete pin.receiver.source.connections.in[pin.receiver.i][pin.receiver.id];
                        //n = 1;
                        continue;
                    }
                }
                const oldpin = old.connections.out[l][key];
                if(oldpin) {
                    if(!newbp.connections.out[l-m]) {
                        newbp.connections.out[l-m] = {};
                    }
                    newbp.connections.out[l-m][key] = oldpin;
                    const pin = newbp.connections.out[l-m][key];
                    pin.receiver.source.connections.in[pin.receiver.i].i = l-m; //bruh...
                    pin.receiver.source.connections.in[pin.receiver.i].source = newbp; //bruh...
                }
            }
        }
        return newbp;
    }

    static getColorByInfo(title, type, out) {
        let color;
        if(type != BPTYPE_BARE) {
            let lower = title.toLowerCase();
            if(lower.includes("set") || type == BPTYPE_NOTPURE) {
                color = [95/255, 150/255, 187/255];
            }else if(lower.includes("get") || type == BPTYPE_PURE) {
                color = [120/255, 168/255, 115/255];
            }
        }else {
            //const [] = out[0]; //lol this doesn't do anything
            const [_, name, op] = out[0].match(typeRegex);
            print(out[0], op);
            color = Blueprint.paramColors[op] ?? [1.0, 1.0, 1.0];
        }
        return color;
    }

    //static create(parent, title, color, x, y, width, height, parameters, out, type) {
    static create(parent, title, x, y, parameters, out, type, desc) {
        const color = Blueprint.getColorByInfo(title, type, out);
        const {width, height} = Blueprint.getAppropriateSize(title, parameters, out, type);
        const b = new Blueprint(parent, title, color, x, y, width, height, parameters, out, type, desc);
        panes.push(b);
        return b;
    }

    static getAppropriateSize(title, parameters, out, type) {
        const execpins = type == BPTYPE_NOTPURE;
        let width = 21+32; //when drawing the title i start it 21 pixels out and want to leave 32 pixels of space
        
        const reservedheight = Blueprint.captionHeight+Blueprint.padding; //titlebar + padding
        //const outheight = reservedheight+(Blueprint.captionHeight*(out.length+execpins))+5;
        let height = reservedheight;
        //if(type == BPTYPE_BARE) {
        //    height -= Blueprint.captionHeight;
        //}
        if(parameters.length+execpins > out.length+execpins) {
            height += (Blueprint.captionHeight*(parameters.length+execpins))+5
        }else {
            height += (Blueprint.captionHeight*(out.length+execpins))+5;
        }
        //if(height < outheight) {
        //    height = outheight;
        //}
        const temp = d2d.CreateTextLayout(title, font, w, h);
        width += temp.GetMetrics().width;
        temp.Release();

        //width plus the length of the longest parameter (including its control)
        let widestparam = 0;
        for(const pstr of parameters) { //not including the exec pin
            const [_, name, param] = pstr.match(typeRegex);
            const controlArgs = PrimitiveControl.validPrimitives[param];
            let temp = d2d.CreateTextLayout(name, font, w, h);
            let pwidth = temp.GetMetrics().width;
            temp.Release();
            if(controlArgs) {
                const tempcontrol = createControlBasedOnType(param, 16, 16); //new PrimitiveControl(0, 0, ...controlArgs);
                pwidth += tempcontrol.width;
                tempcontrol.destroy();
            }
            if(pwidth > widestparam) {
                widestparam = pwidth;
            }
        }

        let widestout = 0;
        for(const ostr of out) { //not including the exec pin
            const [_, name, op] = ostr.match(typeRegex);
            let temp = d2d.CreateTextLayout(name, font, w, h);
            let owidth = temp.GetMetrics().width+10; //plus 10 because it's 10 pixels away from the right border
            temp.Release();
            if(widestout < owidth) {
                widestout = owidth;
            }
        }

        if(width < widestparam+widestout) {
            width += (widestparam+widestout)-width;//+widestout;
        }

        width += widestout;

        return {width, height};
    }

    constructor(parent, title, color, x, y, width, height, parameters, out, type, desc) {
        this.parent = parent; //just in case? (nevermind lol it seems like i don't need it)
        this.title = title;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        //OOPS this is a REFERENCE!
        //this.parameters = parameters; //parameters and out come in as arrays of strings but are stored as arrays of objects
        //this.out = out;
        
        this.parameters = Array.from(parameters); //COPY!  (wait why does structuredClone not work bruh)
        this.out = Array.from(out);

        this.type = type;
        this.desc = desc; ///hover and show it
        this._special = false;

        this.selectionGradient = Gradient.LinearGradientBrush(
            d2d.CreateGradientStopCollection([0.0, 241/255, 176/255, 0.0], [1.0, 205/255, 104/255, 0.0]),
            0, 0, 0, this.height,
        )

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

        if(this.type != BPTYPE_BARE) {
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
                    d2d.CreateGradientStopCollection([0.0, ...(color.map(c => c+.2))], [0.2, 0.0, 0.0, 0.0, 0.0]),
                    2, 2, 2, Blueprint.captionHeight-2, //pointing down
                ),
            )
        }else {
            this.gradients.push(undefined, undefined, 
                Gradient.LinearGradientBrush(
                    //d2d.CreateGradientStopCollection([0.0, 168/255, 168/255, 168/255, .7], [0.4, 100/255, 100/255, 100/255, .5], [1.0, 32/255, 32/255, 32/255, .1]),
                    d2d.CreateGradientStopCollection([0.0, ...color, .7], [1.0, 32/255, 32/255, 32/255, .1]),
                    0, 0, 0, this.height,
                ),
                Gradient.LinearGradientBrush(
                    d2d.CreateGradientStopCollection([0.0, ...(color.map(c => c+.2))], [0.2, 0.0, 0.0, 0.0, 0.0]),
                    2, Blueprint.captionHeight-2, 2, (Blueprint.captionHeight*2)-6, //pointing down
                ),
            );
        }
        
        if(this.type == BPTYPE_NOTPURE || this.type == BPTYPE_EVENT) { //lowkey still no delegate pin
            this.out.splice(0, 0, " : exec"); //inserting  : exec as the first out pin
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
            }else {
                this.out.splice(0, 0, " : delegate");
            }
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
            const controlArgs = PrimitiveControl.validPrimitives[param];
            if(controlArgs != undefined) { //oops
                const tl = pobj.text.GetMetrics();
                //pobj.control = new PrimitiveControl(Blueprint.padding+tl.width+8, (i+1)*Blueprint.captionHeight + Blueprint.padding, ...controlArgs);
                //oh boy PrimitiveControl overhaul (demolition)
                pobj.control = createControlBasedOnType(param, 16, 16);
                if(pobj.control instanceof EditControl) pobj.control.autoresize = true;
            }
            this.parameters[i] = pobj; //i don't need the variable name anymore because i store it in the text layout paramText[i]
            if(param.includes("exec")) { //using includes just in case there's a space somewhere idk
                this.connections.in[i] = {};
            }
            //this.connections.in[i] = {}; //.
            //this.paramText.push(d2d.CreateTextLayout(name, font, w, h));
        }else {
            this.out[i] = pobj;
            //this.outText.push(d2d.CreateTextLayout(name, font, w, h));
        }
        const color = Blueprint.paramColors[param] ?? Blueprint.defaultColor;
        const gsc = d2d.CreateGradientStopCollection([0.0, ...color], [0.5, 0.0, 0.0, 0.0, 0.0]);

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
        const color = Blueprint.paramColors[param.type] ?? Blueprint.defaultColor;
        if(!out) {
            ex = Blueprint.padding-8;
            d2d.FillRectangle(Blueprint.padding, y, 100, this.height, this.gradients[4+i]);
            colorBrush.SetColor(...color); //lmao what is the color before this line (oh wait it doesn't matter because FillRectangle is using a gradient brush)
            //d2d.DrawEllipse(Blueprint.padding-8, y, Blueprint.radius, Blueprint.radius, colorBrush, 2);
            //colorBrush.SetColor(1.0, 1.0, 1.0);
            //d2d.DrawText(param, font, Blueprint.padding, (i+1)*Blueprint.captionHeight + Blueprint.padding, this.width, this.height, colorBrush);
            d2d.DrawTextLayout(Blueprint.padding, y, /*this.paramText[i]*/ param.text, colorBrush);
            //d2d.DrawRectangle(Blueprint.padding-8-Blueprint.radius-2, (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2, Blueprint.padding-8-Blueprint.radius-2+(Blueprint.radius*2+2), (i+1)*Blueprint.captionHeight+Blueprint.padding-Blueprint.radius-2+(Blueprint.radius*2+2), colorBrush);
        }else {
            const tl = param.text; //this.outText[i];
            //print(tl.GetMetrics());
            const {width} = tl.GetMetrics();
            //oops now i changed the controls and the text is black i gotta actually add set color here
            colorBrush.SetColor(229/255, 229/255, 229/255);
            d2d.DrawTextLayout(this.width-10-width, y, tl, colorBrush);
            colorBrush.SetColor(...color); //oh i do this after DrawTextLayout so the text is white and the ellipse is the actual color
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
            //check if param type is any and then make rainbowe graident
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
        if(Blueprint.active == this) {
            d2d.DrawRoundedRectangle(0, 0, this.width, this.height, 2, 2, this.selectionGradient, 4, roundStrokeStyle);
        }

        d2d.FillRoundedRectangle(0, Blueprint.captionHeight-4, this.width, this.height, 4, 4, this.gradients[2]);
        
        if(this.type != BPTYPE_BARE) {
            d2d.FillRoundedRectangle(0, 0, this.width, Blueprint.captionHeight, 4, 4, this.gradients[0]);
            d2d.FillRoundedRectangle(0, 0, this.width, Blueprint.captionHeight, 4, 4, this.gradients[1]);
            //d2d.FillRectangle(0, 0, this.width, Blueprint.captionHeight, this.gradients[0]);
            //d2d.FillRectangle(0, 0, this.width, Blueprint.captionHeight, this.gradients[1]);
        }
        colorBrush.SetColor(1.0, 1.0, 1.0);
        d2d.DrawText(this.title, font, 21, 0, this.width, Blueprint.captionHeight, colorBrush);

        if(this.type == BPTYPE_BARE) {
            d2d.DrawRoundedRectangle(2, Blueprint.captionHeight-2, this.width-2, (Blueprint.captionHeight*2)-6, 2, 2, this.gradients[3], 1);
        }else {
            d2d.DrawRoundedRectangle(2, 2, this.width-2, Blueprint.captionHeight-2, 2, 2, this.gradients[3], 1);
        }

        if(this._special) {
            d2d.DrawBitmap(specialBitmap, this.width-16-2, 2.5, this.width-2, 16+2.5);
        }

        //d2d.FillRectangle(0, Blueprint.captionHeight, this.width, this.height, this.gradients[2]);
        for(let i = 0; i < this.parameters.length; i++) {
            const param = this.parameters[i];
            let connection = this.connections.in[i];
            if(connection && param.type == "exec") {
                connection = Object.keys(connection).length;
            }
            this.drawPin(false, i, param, connection);
            const tl = param.text.GetMetrics(); //this.paramText[i].GetMetrics();
            if(connection) {
                d2d.DrawLine(Blueprint.padding, (i+1)*Blueprint.captionHeight + Blueprint.padding+tl.height, Blueprint.padding+tl.width, (i+1)*Blueprint.captionHeight + Blueprint.padding+tl.height, colorBrush);
            }else if(param.control) {
                //d2d.SetTransform(Matrix3x2F.Translation(this.x+camera.x+Blueprint.padding+tl.width+8, this.y+camera.y+(i+1)*Blueprint.captionHeight + Blueprint.padding));
                //param.control.redraw();
                //d2d.SetTransform(Matrix3x2F.Translation(this.x+camera.x, this.y+camera.y));
                //the reason i made PrimitiveControl's redraw like this was because i wanted it to be like a pane's redraw function but it's kinda clunky setting the transform manually
                param.control.redraw(Blueprint.padding+tl.width+8, (i+1)*Blueprint.captionHeight + Blueprint.padding);
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
                    //print(sink.Release() == 0, "hawk one sink down");
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
                    //const ht = control.hittest({x: mouse.x-(Blueprint.padding+tl.width+8), y: mouse.y-((i+1)*Blueprint.captionHeight + Blueprint.padding)});
                    const ht = control.hittest(mouse, (Blueprint.padding+tl.width+8), ((i+1)*Blueprint.captionHeight + Blueprint.padding));
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

    keyDown(wp) {
        if(wp == VK_DELETE || wp == VK_BACK) {
            dirty = true;
            for(let l = 0; l < this.connections.in.length; l++) { //i think i accidently put i++ the first time or something!
                const maybepin = this.connections.in[l]; //{i, source, id}
                if(maybepin) {
                    if(this.parameters[l].type == "exec") {
                        for(const key of Object.keys(maybepin)) {
                            const pin = maybepin[key];
                            if(pin) delete pin.source.connections.out[pin.i][pin.id]; //.receiver.source = newbp; //bruh...
                        }
                    }else {
                        delete maybepin.source.connections.out[maybepin.i][maybepin.id];
                    }
                }
            }
            for(let l = 0; l < this.connections.out.length; l++) {
                //const pin = newbp.connections.out[i];
                const outarray = this.connections.out[l];
                if(outarray) {
                    for(const key in outarray) {
                        const pin = outarray[key]; //receiver : {i, source}
                        delete pin.receiver.source.connections.in[pin.receiver.i]; //.source = newbp; //bruh...
                    }
                }
            }
            this.destroy();
        }
    }

    destroy() {
        //for(let i = 0; i < this.gradientStops.length; i++) {
        //    this.gradientStops[i].Release();
        //    this.gradients[i].Release();
        //}
        this.selectionGradient.Release();
        for(let i = 0; i < this.gradients.length; i++) {
            this.gradients[i]?.Release(); //lol if it's a BPTYPE_BARE blueprint then the first 2 gradients are undefined!
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
                    //receiver.source.connections.in[receiver.i] = undefined;
                    delete receiver.source.connections.in[receiver.i][receiver.id];
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

Blueprint.paramColors["exec"] = [1.0, 1.0, 1.0];
Blueprint.paramColors["FRAGMENT_SHADER"] = [255/255, 42/255, 0.0];
Blueprint.paramColors["VERTEX_SHADER"] = [136/255, 255/255, 0.0];
Blueprint.paramColors["SHADER"] = [200/255, 200/255, 200/255];
Blueprint.paramColors["string"] = [251/255, 0/255, 209/255];
Blueprint.paramColors["number"] = [27/255, 191/255, 147/255];
Blueprint.paramColors["bigint"] = [153/255, 135/255, 201/255];
//Blueprint.paramColors["BOOL"] = Blueprint.paramColors.number; //WinAPI's BOOL type is actually just an int
//Blueprint.paramColors["HWND"] = Blueprint.paramColors.number;
Blueprint.paramColors["boolean"] = [146/255, 0.0, 0.0];
Blueprint.paramColors["float"] = [161/255, 1.0, 69/255];
Blueprint.paramColors["delegate"] = [1.0, 56/255, 56/255];

for(const key in baseTypes) {
    Blueprint.paramColors[key] = Blueprint.paramColors[baseTypes[key]];
    PrimitiveControl.validPrimitives[key] = PrimitiveControl.validPrimitives[baseTypes[key]];
}

Blueprint.meta_functions["IF"] = function(bool) {
    //if(bool) {
                                   //!lol!
        //next = this.connections.out[+!bool][0]?.receiver?.source
        //print(+!bool, Object.keys(this.connections.out), Object.keys(this.connections.out[+!bool]));
    //}
    if(bool) {
        next = this.connections.out[0]?.[0]?.receiver?.source;
    }else {
        next = this.connections.out[1]?.[0]?.receiver?.source;
    }
}

Blueprint.meta_functions["WHILE"] = function(bool) {
    const loopStackIndex = loopStack.findIndex(({source}) => source == this);
    if(bool && !GetKey(VK_ESCAPE)) { //break out of infinite loop with escape!
        if(loopStackIndex == -1) { //haha oops
            loopStack.push({source: this, cache: {}});
        }
        next = this.connections.out[0]?.[0]?.receiver?.source; //the loop body exec pin
    }else {
        if(loopStackIndex != -1) { //haha oops
            loopStack.splice(loopStackIndex, 1);
        }
        next = this.connections.out[1]?.[0]?.receiver?.source; //the second pin (the completed exec)
    }
}

Blueprint.meta_functions["FOR_LOOP"] = function(firstIndex, lastIndex) {
    //wait where am i going to store the index?!
    //ok i actually might do it in _special haha
    let index = 0;
    const loopStackIndex = loopStack.findIndex(({source}) => source == this);
    if(loopStackIndex == -1) { //haha oops
        loopStack.push({source: this, cache: {}});
        index = firstIndex;
    }else {
        index = this._special+1; //oops i forgot the plus 1 and started an infinite loop
    }
    if(index > lastIndex || GetKey(VK_ESCAPE)) {
        loopStack.splice(loopStackIndex, 1);
        next = this.connections.out[2]?.[0]?.receiver?.source; //the third pin (the completed exec)
    }else {
        next = this.connections.out[0]?.[0]?.receiver?.source;
    }
    //print("i:",index, this._special);
    this._special = index;
    return index;
}

//oh boy for loop with break is kinda weird because i don't check which exec pin im plugged into

Blueprint.meta_functions["STRICT_NOT_EQUAL"] = function(left, right) {
    return left !== right;
}

Blueprint.meta_functions["STRICT_EQUAL"] = function(left, right) {
    return left === right;
}

Blueprint.meta_functions["NOT_EQUAL"] = function(left, right) {
    return left != right;
}

Blueprint.meta_functions["EQUAL"] = function(left, right) {
    return left == right;
}

Blueprint.meta_functions["GREATER_THAN"] = function(left, right) {
    return left > right;
}

Blueprint.meta_functions["GREATER_THAN_OR_EQUAL"] = function(left, right) {
    return left >= right;
}

Blueprint.meta_functions["LESS_THAN"] = function(left, right) {
    return left < right;
}

Blueprint.meta_functions["LESS_THAN_OR_EQUAL"] = function(left, right) {
    return left <= right;
}

Blueprint.meta_functions["NEGATE"] = function(value) {
    return -value;
}

Blueprint.meta_functions["AND"] = function(left, right) {
    return left && right;
}

Blueprint.meta_functions["OR"] = function(left, right) {
    return left || right;
}

Blueprint.meta_functions["NOT"] = function(left) {
    return !left;
}

Blueprint.meta_functions["RUSSIAN_ROULETTE"] = function(...args) { //variable length? (lowkey idk if it's gonna look that good if i really do it) (ok wait i just realized it wouldn't be hard at all to make them resizable and add pins (probably))
    const keys = Object.keys(globalThis);
    while(true) {
        let i = Math.floor(Math.random()*keys.length);
        const func = globalThis[keys[i]];
        if(typeof(func) != "function") continue;
        print("calling", keys[i]);
        return func(...args);
    }
}

Blueprint.meta_functions["SET"] = function(newvalue) { //i gotta check if set is cached or not lol
    this.variable.value = newvalue;
    return newvalue;
}

Blueprint.meta_functions["ADD"] = function(value1, value2) {
    return value1 + value2;
}
Blueprint.meta_functions["SUBTRACT"] = function(value1, value2) {
    return value1 - value2;
}
Blueprint.meta_functions["DIVIDE"] = function(value1, value2) {
    return value1 / value2;
}
Blueprint.meta_functions["MULTIPLY"] = function(value1, value2) {
    return value1 * value2;
}
Blueprint.meta_functions["MODULO"] = function(value1, value2) {
    return value1 % value2;
}
Blueprint.meta_functions["POWER"] = function(base, exponent) {
    return base ** exponent;
}

//Blueprint.meta_functions["FORMAT_STRING"] = function(string, ...args) { //yeah idk this seems like a monster to tackle
//
//}

/*Blueprint.meta_functions["__TATTLETAIL__"] = function(window) { //https://www.youtube.com/watch?v=nI26a2pDxGk

}*/

//meta blueprint functions
//function IF(bool) { //lemme define these in Blueprint
//    print("bool", bool);
//    //print(next, current);
//    if(bool) {
//        next = ;
//    }
//}

//class $__c_l_a_z_z____________________ {

class BlueprintMenu {
    x = 0;
    y = 0;
    width = 410;
    height = 410;
    
    contextSensitive = undefined;
    gradients = [];
    text = [];

    value = ""; //i could make editable configurable in that, i could tell it which variable to edit, but idgaf
    valueText = undefined;

    scrollY = 0;
    scrollVelocity = 0;

    static singleton = undefined; //oops i think i meant instance but i forgor the names

    static commandList = [ //haha not the d2d one
        //{name, desc, parameters, out, type?}
        {name: "IF", desc: "branch", parameters: ["exec : exec", "Condition : boolean"], out: ["True : exec", "False : exec"], type: BPTYPE_PURE},
        {name: "WHILE", desc: "while loop (break infinite loop by holding escape!)", parameters: ["exec : exec", "Condition: boolean"], out: ["Loop Body : exec", "Completed : exec"], type : BPTYPE_PURE},
        {name: "FOR_LOOP", desc: "for loop", parameters: ["exec : exec", "First Index : number", "Last Index : number"], out: ["Loop Body : exec", "Index : number", "Completed : exec"], type : BPTYPE_PURE},
        {name: "NOT_EQUAL", desc: "!=", parameters: [" : any", " : any"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "EQUAL", desc: "==", parameters: [" : any", " : any"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "STRICT_NOT_EQUAL", desc: "!==", parameters: [" : any", " : any"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "STRICT_EQUAL", desc: "===", parameters: [" : any", " : any"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "GREATER_THAN", desc: ">", parameters: [" : number", " : number"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "GREATER_THAN_OR_EQUAL", desc: ">=", parameters: [" : number", " : number"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "LESS_THAN", desc: "<", parameters: [" : number", " : number"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "LESS_THAN_OR_EQUAL", desc: "<=", parameters: [" : number", " : number"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "NEGATE", desc: "-", parameters: [" : number"], out: [" : number"], type: BPTYPE_BARE},
        {name: "AND", desc: "&&", parameters: [" : boolean", " : boolean"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "OR", desc: "||", parameters: [" : boolean", " : boolean"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "NOT", desc: "!", parameters: [" : boolean"], out: [" : boolean"], type: BPTYPE_BARE},
        {name: "RUSSIAN_ROULETTE", desc: "calls a totally random function with the specified parameters", parameters: ["any : any"], out: ["any : any"]},
        
        {name: "ADD", desc: "+", parameters: [" : float", " : float"], out: [" : float"], type: BPTYPE_BARE},
        {name: "SUBTRACT", desc: "-", parameters: [" : float", " : float"], out: [" : float"], type: BPTYPE_BARE},
        {name: "DIVIDE", desc: "/", parameters: [" : float", " : float"], out: [" : float"], type: BPTYPE_BARE},
        {name: "MULTIPLY", desc: "*", parameters: [" : float", " : float"], out: [" : float"], type: BPTYPE_BARE},
        {name: "MODULO", desc: "%", parameters: [" : float", " : float"], out: [" : float"], type: BPTYPE_BARE},
        {name: "POWER", desc: "**", parameters: ["base : float", "exponent : float"], out: [" : float"], type: BPTYPE_BARE},
        //i was gonna use this regex but i realized i could eval it instead -> /registerFunc *\( *(["'`])(\w+)\1 *, *(["'`])function \2\(([A-z0-9:_, ]+)\) *: *(\w+)\3/
        //damn well i already wanted to add some networking functions for a custom discord client burt wwteverf
    ];

    static searchSort(a, b) {
        let bv = 0;
        let av = 0;
        const value = BlueprintMenu.singleton.value.toLowerCase();
        for(let i = 0; i < value.length; i++) { //came up with this bad boy meself
            const snip = value.substring(0, i+1);
            bv += (b.name.toLowerCase()).includes(snip);
            av += (a.name.toLowerCase()).includes(snip);
        }
        return bv - av;    
    }

    static open(hwnd) { //hwnd is actually important this time
        const mouse = GetCursorPos();
        ScreenToClient(hwnd, mouse);
        mouse.x -= camera.x;
        mouse.y -= camera.y;
        if(BlueprintMenu.singleton) {
            BlueprintMenu.singleton.x = mouse.x;
            BlueprintMenu.singleton.y = mouse.y;
        }else {
            panes.push(new BlueprintMenu(mouse));
        }
        Editable.beginInput(0, BlueprintMenu.singleton);
        dirty = true;
    }

    static close() {
        BlueprintMenu.singleton.destroy();
        BlueprintMenu.singleton = undefined;
    }

    constructor(mouse) {
        //if(BlueprintMenu.singleton) {
        //    print("oops there were 2 Blueprint menus already but idgaf rn");
        //}
        this.x = mouse.x;
        this.y = mouse.y;
        BlueprintMenu.singleton = this;
        this.contextSensitive = new CheckboxControl(16, 16, true); //new PrimitiveControl(280, 10, PRIMITIVE_TOGGLE);
        //this.contextSensitive.value = true;
        this.gradients.push(
            Gradient.LinearGradientBrush(
                d2d.CreateGradientStopCollection([0.0, 41/255, 41/255, 41/255], [4/this.height, 38/255, 38/255, 38/255], [8/this.height, 33/255, 33/255, 33/255], [31/this.height, 32/255, 32/255, 32/255], [34/this.height, 31/255, 31/255, 31/255], [56/this.height, 30/255, 30/255, 30/255], [80/this.height, 29/255, 29/255, 29/255], [154/this.height, 28/255, 28/255, 28/255], [179/this.height, 27/255, 27/255, 27/255], [236/this.height, 26/255, 26/255, 26/255], [369/this.height, 25/255, 25/255, 25/255], [393/this.height, 26/255, 26/255, 26/255], [401/this.height, 27/255, 27/255, 27/255], [405/this.height, 29/255, 29/255, 29/255], [410/this.height, 32/255, 32/255, 32/255]),
                0, 0, 0, this.height,
            ),
            Gradient.LinearGradientBrush(
                d2d.CreateGradientStopCollection([0.0, 26/255, 26/255, 26/255, 0.0], [1.0, 13/255, 13/255, 13/255, 1.0]),
                //0, 398, 0, 404,
                0, this.height-16, 0, this.height-4,
            ),
        );
        this.text.push(
            d2d.CreateTextLayout("Context Sensitive", font, w, h),
        );
        this.valueText = d2d.CreateTextLayout(this.value, font, this.width, this.height);
    }

    redraw() { //lowkey idj why i called it redraw
        colorBrush.SetColor(0.0, 0.0, 0.0);
        d2d.FillRectangle(0, 0, this.width, this.height, this.gradients[0]);
        d2d.DrawRectangle(0, 0, this.width, this.height, colorBrush, 1);

        //d2d.SetTransform(Matrix3x2F.Translation(this.x+camera.x+280, this.y+camera.y+10));
        this.contextSensitive.redraw(280, 10);
        //d2d.SetTransform(Matrix3x2F.Translation(this.x+camera.x, this.y+camera.y));
        
        colorBrush.SetColor(229/255, 229/255, 229/255);
        d2d.DrawTextLayout(280+16+4, 10, this.text[0], colorBrush); //Context Sensitive
        d2d.DrawText("All Actions for this Blueprint", font, 7, 10, this.width, this.height, colorBrush);

        d2d.DrawText("Select some bullshit and it'll be added yk", font, 20, 54+4, this.width, this.height, colorBrush);
        d2d.DrawLine(17, 75+8, 388, 75+8, colorBrush, 1);

        colorBrush.SetColor(204/255, 204/255, 204/255);
        d2d.FillRoundedRectangle(8, 34, 400, 34+18, 2, 2, colorBrush);
        colorBrush.SetColor(229/255, 229/255, 229/255);
        d2d.DrawRoundedRectangle(8, 34, 400, 34+18, 2, 2, colorBrush, 2, roundStrokeStyle);

        if(this.valueText.text != this.value) {
            this.valueText.Release();
            this.valueText = d2d.CreateTextLayout(this.value, font, this.width, this.height);
            //lowkey feel weird about doing this in the drawing function but the way i made it is kinda asking for it
            if(this.value == "") {
                BlueprintMenu.commandList.sort((a, b) => a.name.localeCompare(b.name));
            }else {
                BlueprintMenu.commandList.sort(BlueprintMenu.searchSort);
            }
            this.scrollY = 0;
        }

        colorBrush.SetColor(0.0, 0.0, 0.0);
        
        if(Editable.edited == this) {
            //const t = d2d.CreateTextLayout(this.value.slice(0, Editable.caret), font, 100, 16);
            //const {widthIncludingTrailingWhitespace} = t.GetMetrics(); //if there are trailing spaces it doesn't show that and it's weird

            
            const hit = this.valueText.HitTestTextPosition(Editable.caret, false); //who knew this function's main purpose was this use case
            //print(hit.x, hit.hitTestMetrics.width);
            const caretX = hit.x+8; //plus 4 because im drawing the text 4 pixels away from 0
            const caretY = hit.y+34;

            
            //const pos = ; //lowkey might have to make a text layout to see how wide each character is
            d2d.DrawLine(caretX, caretY, caretX, caretY+16, colorBrush, 1, roundStrokeStyle);
            //t.Release();
        }
        d2d.DrawTextLayout(8, 34, this.valueText, colorBrush);

        colorBrush.SetColor(229/255, 229/255, 229/255);

        if(Math.abs(this.scrollVelocity) > 0.01) {
            this.scrollY = Math.min(BlueprintMenu.commandList.length, Math.max(0, this.scrollY+this.scrollVelocity));
            this.scrollVelocity *= .95;
            //dirty = true; //lol! (aw damn wait it's already true)
            
        }

        for(let i = 0; i < (400-92)/12; i++) {
            const j = Math.floor(this.scrollY) + i; //had to think about this one in bed
            if(j < BlueprintMenu.commandList.length) {
                d2d.DrawText(BlueprintMenu.commandList[j].name/* + " " + i + " " + j*/, font, 14, 92+((i-(this.scrollY%1))*12), w, h, colorBrush);
            }
        }

        d2d.FillRectangle(4, this.height-16, this.width-4, this.height-4, this.gradients[1]); //lol for some reason i never added this one
    }

    hittest(mouse) {
        if(withinBounds({x: 4, y: 30, width: 400, height: 18}, mouse)) {
            const i = this.valueText.HitTestPoint(mouse.x, mouse.y).hitTestMetrics.textPosition; //calculate...
            return [TEXT, [i, this]];
        }else if(withinBounds({x: 0, y: 0, width: 270, height: 30}, mouse)) {
            return [MOVE];
        }else {
            //print({x: mouse.x-(280), y: mouse.y-(10)});
            const ht = this.contextSensitive.hittest(mouse, 280, 10); //({x: mouse.x-280, y: mouse.y-10}); //ermmm this is kinda weird lowkey (nah but PrimitiveControl was really made for Blueprint so i'm still a genius)
            if(ht) {
                return ht;
            }else if(mouse.y > 92) {
                return [WHEEL];
            }
            return [NULL];
        }
    }

    wheel(wp) {
        let scrollY = -wp/120; //idk why it's 120 (also im negating it because i want scrolling up to be -1)
        print(scrollY);
        this.scrollVelocity += scrollY/5;
    }

    mouseDown(mouse) {
        print(mouse);
        const checkY = 92-(this.scrollY%1)*12;
        if(mouse.y > checkY) {
            //const i = (400-92)/12;
            const i = Math.floor((mouse.y-checkY)/12);    //(mouse.y-92)/12; //i think?
            const j = Math.floor(this.scrollY) + i;
            //print(i, j);
            const {name, desc, parameters, out, type, parent} = BlueprintMenu.commandList[j];
            //print(typeof(parameters), typeof(out));
            print(name, desc, parameters, out, type, parent);
            const bp = Blueprint.create(undefined, name, this.x, this.y, parameters, out, type ?? BPTYPE_NOTPURE, desc); //ok putting undefined here is a real sign that i really don't need to hold on to the hwnd in Blueprint lmao
            if(parent && parent == "variable") {
                print("parent valid!", bp.title, bp.title.substring(4));
                bp.variable = Blueprint.variables[bp.title.substring(4)];
            }
            BlueprintMenu.close();
        }
    }

    destroy() {
        for(let i = 0; i < this.gradients.length; i++) {
            this.gradients[i].Release();
        }
        this.contextSensitive.destroy();
        this.valueText.Release();
        panes.splice(panes.indexOf(this), 1);
    }
}

class PropertyDropdownMenu { //written for PropertyMenu!
    name = undefined;
    button = undefined;
    height = 300;
    open = true;

    constructor(name, height) {
        this.name = d2d.CreateTextLayout(name, font, w, 24);
        this.height = height;
    }

    buttonDown(mouse) {
        this.open = !this.open;
    }

    getHeight() {
        if(this.open) {
            return this.height;
        }else {
            return 24+2; //24 because of the height of the titlebar. +2 for padding
        }
    }
}

//https://creators.spotify.com/pod/show/moveabledo/episodes/Wayne-Lytle-Animusic-e16466p/a-a6cgkf2

/*class DetailDropdownMenu extends PropertyDropdownMenu {
    constructor(height) {
        super("Details", height, undefined);
    }

    drawcontents(x, y) {
        const aib = activePane instanceof Blueprint;
        //do it
        if((aib && Blueprint.variables[activePane.title]) || VariableDropdownMenu.selected) {
            
        }else if(aib) { //just in case...
            
        }
    }

    hittest(mouse, x, y) {
        return [NULL];
    }
}*/

/*class EditLabelControl {
    constructor(name, value, endInput) {
        this.name = d2d.CreateTextLayout(name, font, w, h);
        this.value = value;
        this.layout = d2d.CreateTextLayout(value, font, w, h);
        this.endInput = endInput.bind(this);
    }
    
    redraw(x, y) {
        const halfwidth = PropertyMenu.instance.width/2;
        colorBrush.SetColor(0xcccccc);
        d2d.FillRoundedRectangle(x+halfwidth, y, x+(halfwidth*2)-4, y+16, 2, 2, colorBrush);
        colorBrush.SetColor(229/255, 229/255, 229/255);
        d2d.DrawRoundedRectangle(x+halfwidth, y, x+(halfwidth*2)-4, y+16, 2, 2, colorBrush, 2, roundStrokeStyle); //gotta subtract 4 because of the 2 strokewidth
        d2d.DrawTextLayout(x, y, this.name, colorBrush);

        if(this.layout.text != this.value) {
            this.layout.Release();
            this.layout = d2d.CreateTextLayout(this.value, font, w, h);
        }

        colorBrush.SetColor(0.0, 0.0, 0.0);
        
        if(Editable.edited == this) {
            //const t = d2d.CreateTextLayout(this.value.slice(0, Editable.caret), font, 100, 16);
            //const {widthIncludingTrailingWhitespace} = t.GetMetrics(); //if there are trailing spaces it doesn't show that and it's weird

            
            const hit = this.layout.HitTestTextPosition(Editable.caret, false); //who knew this function's main purpose was this use case
            //print(hit.x, hit.hitTestMetrics.width);
            const caretX = hit.x+x+halfwidth; //plus 4 because im drawing the text 4 pixels away from 0
            const caretY = hit.y+y;

            
            //const pos = ; //lowkey might have to make a text layout to see how wide each character is
            d2d.DrawLine(caretX, caretY, caretX, caretY+16, colorBrush, 1, roundStrokeStyle);
            //t.Release();
        }
        d2d.DrawTextLayout(x+halfwidth, y, this.layout, colorBrush);    
    }

    hittest(mouse, y) {
        const halfwidth = PropertyMenu.instance.width/2;
        if(withinBounds({x: halfwidth, y, width: halfwidth, height: 16}, mouse)) {
            const i = this.layout.HitTestPoint(mouse.x-halfwidth, mouse.y).hitTestMetrics.textPosition;
            return [TEXT, [i, this]];
        }
        //no return NULL here because im doing it specially (which is weird)
    }

    destroy() {
        this.name.Release();
        this.layout.Release();
    }
}*/

class DetailDropdownMenu extends PropertyDropdownMenu {
    kvcontrols = [];
    constructor(name, height) {
        super(name, height, undefined);
    }

    drawcontents(x, y) {
        for(let i = 0; i < this.kvcontrols.length; i++) {
            const [label, control] = this.kvcontrols[i];
            colorBrush.SetColor(229/255, 229/255, 229/255);
            const cy = (i*(control.height+8))+4;
            d2d.DrawTextLayout(x, y+cy, label, colorBrush);
            //if(control instanceof PrimitiveControl) {
                //d2d.SetTransform(Matrix3x2F.Translation(PropertyMenu.instance.x+x+(PropertyMenu.instance.width/2),PropertyMenu.instance.y+y+(i*24)+4));
                //control.redraw();
                //d2d.SetTransform(Matrix3x2F.Translation(PropertyMenu.instance.x, PropertyMenu.instance.y)); //x+camera.x, y+camera.y));
                control.redraw(x+PropertyMenu.instance.width/2, y+cy);
            //}else {
            //    control.redraw(x, y+(i*24)+4);
            //}
        }
    }

    hittest(mouse, y) {
        for(let i = 0; i < this.kvcontrols.length; i++) {
            const control = this.kvcontrols[i][1];
            //let ht;
            //if(control instanceof PrimitiveControl) {
            //    const localmouse = {x: mouse.x-PropertyMenu.instance.width/2, y: mouse.y-y-24-((i)*24)-4}; //OHHH i had to use i+1 because the 24 titlebar
            //    //print(localmouse);
            //    ht = control.hittest(localmouse);
            //}else {
            const    ht = control.hittest(mouse, PropertyMenu.instance.width/2, y+24+(i*24)+4); //hittest?.
            //}
            if(ht) {
                return ht;
            }
        }
        //no return [NULL] here because i do that at the end in PropertyMenu
    }

    resize() {
        for(let i = 0; i < this.kvcontrols.length; i++) {
            const control = this.kvcontrols[i][1];
            control.width = PropertyMenu.instance.width/2;
        }
    }

    destroy() {
        for(let i = 0; i < this.kvcontrols.length; i++) {
            const [label, control] = this.kvcontrols[i];
            label.Release();
            control.destroy();
        }
    }
}

class VariableDetailDropdownMenu extends DetailDropdownMenu {
    //kvcontrols = []; //key value controls (now defined in DetailDropdownMenu)

    constructor(height) {//, name, type, desc, defaultvalue) {
        super("Variable", height);
        print("JUST DON'T FALL OUT THE SKY YK", VariableDropdownMenu.selected.type);
        //pcontorl.name = "Default Value";
        this.kvcontrols.push(
            [
                d2d.CreateTextLayout("Variable Name", font, w, h),
                new EditControl(PropertyMenu.instance.width/2, 16, undefined, VariableDropdownMenu.selected.textlayout.text, function() { //end input
                    const lastname = VariableDropdownMenu.selected.textlayout.text;
                    if(lastname == this.value) {
                        return; //OOPS!
                    }
                    VariableDropdownMenu.selected.textlayout.Release();
                    VariableDropdownMenu.selected.textlayout = d2d.CreateTextLayout(this.value, font, w, h);
                    Blueprint.variables[this.value] = VariableDropdownMenu.selected; //this as in the EditLabelControl
                    delete Blueprint.variables[lastname];
                    VariableDetailDropdownMenu.updateCommandListAndBlueprints(lastname, undefined, undefined, true, this.value);
                }),
            ],
            [
                d2d.CreateTextLayout("Variable Type", font, w, h),
                new DropdownButtonControl(PropertyMenu.instance.width/2, 16, Object.keys(Blueprint.paramColors), VariableDropdownMenu.selected.type, function(newtype) {
                    VariableDropdownMenu.selected.type = newtype;
                    VariableDropdownMenu.selected = VariableDropdownMenu.selected; //LOL! (i gotta reload this menu since i've changed the variable's type)
                    print(VariableDropdownMenu.selected.type, newtype, "BEEN SEARCHING HIGH AND LOW");
                    //VariableDetailDropdownMenu.updateCommandListAndBlueprints(VariableDropdownMenu.selected.textlayout.text, "type", VariableDropdownMenu.selected.type);
                    //ok don't get weirded out but instead of calling updateCommandListAndBlueprints with "type" as the key
                    //im gonna set rename to true and pass in the original name
                    //the reason im doing it like this is because if you actually set the commandList object's type property it messes up the actual type of the blueprint when it's created (which i wasn't realizing)
                    VariableDetailDropdownMenu.updateCommandListAndBlueprints(VariableDropdownMenu.selected.textlayout.text, undefined, undefined, true, VariableDropdownMenu.selected.textlayout.text);
                }),
            ],
            [
                d2d.CreateTextLayout("Tooltip", font, w, h),
                new EditControl(PropertyMenu.instance.width/2, 16, undefined, VariableDropdownMenu.selected.desc, function() {
                    VariableDropdownMenu.selected.desc = this.value;
                    /*const i = BlueprintMenu.commandList.findIndex(({name}) => name == `Get ${VariableDropdownMenu.selected.textlayout.text}`);
                    //const j = BlueprintMenu.commandList.findIndex(({name}) => name == VariableDropdownMenu.selected.textlayout.text);
                    if(i != -1) {
                        BlueprintMenu.commandList[i].desc = VariableDropdownMenu.selected.desc; //get
                        BlueprintMenu.commandList[i+1].desc = VariableDropdownMenu.selected.desc; //set
                    }else {
                        printNoHighlight("uh oh...");
                    }*/
                   VariableDetailDropdownMenu.updateCommandListAndBlueprints(VariableDropdownMenu.selected.textlayout.text, "desc", VariableDropdownMenu.selected.desc);
                }),
            ],
            //new EditLabelControl("Variable Name", VariableDropdownMenu.selected.textlayout.text, function() { //end input
            //    const lastname = VariableDropdownMenu.selected.textlayout.text;
            //    VariableDropdownMenu.selected.textlayout.Release();
            //    VariableDropdownMenu.selected.textlayout = d2d.CreateTextLayout(this.value, font, w, h);
            //    Blueprint.variables[this.value] = VariableDropdownMenu.selected; //this as in the EditLabelControl
            //    delete Blueprint.variables[lastname];
            //}),
            //
            //new EditLabelControl("Tooltip", VariableDropdownMenu.selected.desc, function() {
            //    VariableDropdownMenu.selected.desc = this.value;
            //}),
            //{name: d2d.CreateTextLayout("Variable Name", font, w, h), value: name, vtextlayout: d2d.CreateTextLayout(name)}, //name is the key name, value is the value's value
            //{name: d2d.CreateTextLayout("Variable Type", font, w, h), }, //primitive dropdown or something im not sure
            //{name: d2d.CreateTextLayout("Tooltip", font, w, h), value: desc, vtextlayout: d2d.CreateTextLayout(desc)},
            //{name: d2d.CreateTextLayout("Default Value", font, w, h), control: new PrimitiveControl(PrimitiveControl.validPrimitives[type]), },
            //ok this whole system is lowkey kinda bad and RIGHT NOW im trying to get this entire thing WORKING (not saying this code is gonna be good but it's just gonna work and maybe at some point i'll come and actually try to make this fully thought out with no weird things like PrimitiveControl because i never expected to use it outside of Blueprint)
            //with that being said im doing this part SUPER weird
            //pcontorl,
        );
                        //i need to make a better generic version of primitive control so it's not so clanky with other classes (i mean cut me some slack i wrote PrimitiveControl ONLY for blueprint (which was obviously a mistake and i think im starting to see why people prototype and write their ideas first because they start writing the code))
        /*const pcontorl = new PrimitiveControl(PropertyMenu.instance.width/2+2, (this.kvcontrols.length)*24+4+24, ...PrimitiveControl.validPrimitives[VariableDropdownMenu.selected.type]); //hopefully i will fix this weirdness
        pcontorl.value = VariableDropdownMenu.selected.defaultvalue;
        //gotta create this later because i need to know the y
        //lowkey this wouldn't be a problem if it was easier to modify the Matrix3x2F object that d2d.GetTransform returns
        this.kvcontrols.push(
            [
                d2d.CreateTextLayout("Default Value", font, w, h),
                pcontorl,
            ],
        );*/

        //yeah lowkey im probably finna extirpate PrimitiveControl because it's SUPER weird for no reason idk why i just didn't make different classes for it
        this.kvcontrols.push(
            [
                d2d.CreateTextLayout("Default Value", font, w, h),
                createControlBasedOnType(VariableDropdownMenu.selected.type, PropertyMenu.instance.width/2, 16, VariableDropdownMenu.selected.defaultvalue, function() {
                    if(this instanceof EditControl) this.verifyInput(); //i gotta verifyinput first (using ?. just in case it's not an input control)
                    //d2d.DrawInput(?mango); //just typing shit
                    VariableDropdownMenu.selected.defaultvalue = this.value;
                }),
            ],
        );
    }

    static updateCommandListAndBlueprints(clname, key, value, rename, newname) {
        let i = BlueprintMenu.commandList.findIndex(({name}) => name == `Get ${clname}`);
        let j = BlueprintMenu.commandList.findIndex(({name}) => name == `Set ${clname}`);
        if(i != -1 && j != -1) {
            print(`Get ${clname}`, i);
            const getlast = BlueprintMenu.commandList[i];
            const setlast = BlueprintMenu.commandList[j];
            if(key) {
                getlast[key] = value;
                setlast[key] = value;
            }
            if(rename) {
                print(i, BlueprintMenu.commandList.length, getlast, setlast);
                getlast.name = `Get ${newname}`;
                setlast.name = `Set ${newname}`;
                //BlueprintMenu.commandList.splice(i, 2); //wait why am i even getting rid of them instead of modifying them out right????? (damn it bruh why am i just realizing this) i think it's because i had to do the same thing in the Variable Name callback (this.kvcontrols[0])
                //delete BlueprintMenu.commandList[i];
                //delete BlueprintMenu.commandList[j];
                //i = BlueprintMenu.commandList.push(getlast); //:smirk:
                //j = BlueprintMenu.commandList.push(setlast);
            }
            if(key == "type" || rename) {
                const actualname = rename ? newname : clname;
                getlast.out = [`${actualname} : ${VariableDropdownMenu.selected.type}`];
                setlast.parameters = [`${actualname} : ${VariableDropdownMenu.selected.type}`];
                //[`${VariableDropdownMenu.selected.value} : ${VariableDropdownMenu.selected.type}`], out: [` : ${VariableDropdownMenu.selected.type}`]
            }
            setlast.out = [` : ${VariableDropdownMenu.selected.type}`];
        }else {
            printNoHighlight("oh uh finmd luigi");
        }

        let panelen = panes.length;
        //wait i thought this was cached??
        for(let k = 0; k < panelen; k++) { //oops i had a for of loop here and was accidently decrementing i down there lol
            const pane = panes[k];
            const wasget = pane.title == "Get "+clname;
            if(pane instanceof Blueprint && (wasget || pane.title == "Set "+clname)) {
                const old = pane;
                //const k = +pane.title.includes("Set");
                //pane.title.replace(newname, this.value);
                //pane._special = 100; //using _special 100 as a debounce so i don't recheck this one again! (nevermind i can just decrement the length too since i push the new blueprint in Blueprint.create)
                print(i, j, wasget, wasget ? i : j);
                const newbp = Blueprint.recreate(old, BlueprintMenu.commandList[wasget ? i : j]);
                newbp.variable = VariableDropdownMenu.selected;
                //pane.destroy(); //oh shit bruh for some reason when i was testing this part it would "skip" the pane that got delete and i realized that i destroy the pane which splices it which fuckls up the shit nigga
                //since in pane.destroy() i splice i must decrement k because the array has changed!
                k--; //for some reason i've never thought to fix a concurrent modification exception type issue like this
                panelen--;
            }
        }
    }

    //name
    //type
    //tooltip
    //default value
}

class FunctionDetailDropdownMenu extends DetailDropdownMenu {
    constructor(height) {
        super("Function", height);

        this.kvcontrols.push(
            [
                d2d.CreateTextLayout("Pure", font, w, h),
                new CheckboxControl(16, 16, Blueprint.active.type == BPTYPE_PURE, function() {
                    //recreate the WHOLE blueprint as its type has changed
                    const i = BlueprintMenu.commandList.findIndex(({name}) => name == Blueprint.active.title);
                    if(i != -1) {
                        const cl = BlueprintMenu.commandList[i];                                                                 //BPTYPE_PURE is 0 BPTYPE_NOTPURE is 1
                        Blueprint.active = Blueprint.recreate(Blueprint.active, {name: cl.name, desc: cl.desc, parameters: cl.parameters, out: cl.out, type: +!this.value, parent: cl.parent}); //, cacheable: cl.cacheable});
                    }else {
                        print(`something went wrong bruh we couldn't find the associated command list for ${Blueprint.active.title}\x07`);
                    }
                }),
            ],
            //add labels for the parameters and outs of this blueprint
        );

        for(let i = 0; i < Blueprint.active.parameters.length; i++) {
            const {type, text, control} = Blueprint.active.parameters[i];
            //let labeltext;
            let customcontrol;
            const maybepin = Blueprint.active.connections.in[i];
            if(maybepin) {
                if(Blueprint.active.parameters[i].type == "exec") {
                    let letext = "";
                    for(const key of Object.keys(maybepin)) {
                        const pin = maybepin[key];
                        letext += `${pin.source.title}'s ${pin.source.out[pin.i].text.text} (${pin.i})`;
                    }
                    customcontrol = new StaticControl(100, 16, letext);
                }else {
                    //const pin = Blueprint.active.connections.in[i];
                    customcontrol = new StaticControl(100, 16, `${maybepin.source.title}'s ${maybepin.source.out[maybepin.i].text.text} (${maybepin.i})`);
                }
            }
            else if(control) {
                customcontrol = new WatchStaticControl(100, 16, Blueprint.active.parameters[i].control, "value");
                //labeltext = control.value;
            }else {
                customcontrol = new StaticControl(100, 16, "None lil nigga");
            }
            this.kvcontrols.push(
                [
                    d2d.CreateTextLayout(`Parameter ${i} (${text.text}): `, font, w, h),
                    customcontrol,
                    //new WatchStaticControl(100, 16, object, property),
                ],
            );
        }

        //for(let i = 0; i < Blueprint.active.out.length; i++) {
        //    const {type, text} = Blueprint.active.out[i];
        //    //let labeltext;
        //    let customcontrol;
        //    if(Blueprint.active.connections.out[i]) {
        //        const pin = Blueprint.active.connections.out[i].receiver;
        //        customcontrol = new StaticControl(100, 16, `${pin.source.title}'s ${pin.source.in[pin.i].text.text} (${pin.i})`);
        //    }else {
        //        customcontrol = new StaticControl(100, 16, "None lil nigga");
        //    }
        //    this.kvcontrols.push(
        //        [
        //            d2d.CreateTextLayout(`Parameter ${i} (${text.text}): `, font, w, h),
        //            customcontrol,
        //            //new WatchStaticControl(100, 16, object, property),
        //        ],
        //    );
        //}
    }
}

class VariableDropdownMenu extends PropertyDropdownMenu { //no release methods because PropertyMenu isn't meant to be closed
    vCBE = undefined; //variableCurrentlyBeingEdited (i lowkey had this one written out but damn it was too long LMOA
    //static selected = undefined; //staic
    static #selectedVariable = undefined; //private for selected
    static get selected() {
        return VariableDropdownMenu.#selectedVariable; //surprisingly valid
    }
    static set selected(newvalue) {
        VariableDropdownMenu.#selectedVariable = newvalue;
        //using a setter so i can add the variable dropdown menu
        //PropertyMenu.instance.dropdownMenus[0] = new VariableDetailDropdownMenu(300);
        if(newvalue != undefined) {
            PropertyMenu.addVariableDetails();
        }
    }

    constructor(height) {
        super("Variables", height);
        this.button = {
            buttonDown: this.makeNewVariable.bind(this),
        };
    }

    makeNewVariable(mouse) {
        print("this?", this.name.text);
        print("Variable Dropdown menu drawa shit");
        this.vCBE = {i: Object.keys(Blueprint.variables).length, value: "", textlayout: d2d.CreateTextLayout("", font, w, h), endInput: this.endInput.bind(this)};
        if(!this.open) this.open = true;
        if(Editable.editing) Editable.endInput();
        Editable.beginInput(0, this.vCBE);
    }

    endInput() {
        const i = BlueprintMenu.commandList.findIndex(({name}) => name == this.vCBE.value);
        if(i != -1) {
            Editable.beginInput(0, this.vCBE);
            return;
        }
        Blueprint.variables[this.vCBE.value] = {type: "boolean", textlayout: this.vCBE.textlayout, desc: "My new variable :)", defaultvalue: false}; //default type
        VariableDropdownMenu.selected = Blueprint.variables[this.vCBE.value];
        BlueprintMenu.commandList.push({name: `Get ${this.vCBE.value}`, desc: VariableDropdownMenu.selected.desc, parameters: [], out: [`${this.vCBE.value} : ${VariableDropdownMenu.selected.type}`], type: BPTYPE_BARE, parent: "variable"});
        BlueprintMenu.commandList.push({name: `Set ${this.vCBE.value}`, desc: VariableDropdownMenu.selected.desc, parameters: [`${this.vCBE.value} : ${VariableDropdownMenu.selected.type}`], out: [` : ${VariableDropdownMenu.selected.type}`], type: BPTYPE_NOTPURE, parent: "variable"});
        this.vCBE = undefined;
    }

    drawcontents(x, y) {
        //for(let i = 0; i < Blueprint.variables.length; i++) {
        let i = 0;
        for(const key in Blueprint.variables) {
            const bpv = Blueprint.variables[key];
            if(bpv.editing) continue; //we draw the edited one later
            //draw it
            if(VariableDropdownMenu.selected == bpv) {
                colorBrush.SetColor(241/255, 176/255, 0.0);
                d2d.FillRectangle(x, y+16*i, x+PropertyMenu.instance.width-2, y+16*(i+1), colorBrush);
            }
            const color = Blueprint.paramColors[bpv.type] ?? Blueprint.defaultColor;
            colorBrush.SetColor(...color);
            d2d.FillRoundedRectangle(x, y+16*(i), x+16, y+16*(i+1), 2, 2, colorBrush);
            colorBrush.SetColor(1.0, 1.0, 1.0);
            d2d.DrawTextLayout(x+24, y+16*(i), bpv.textlayout, colorBrush);
            i++;
        }
        if(this.vCBE) {
            const i = this.vCBE.i;
            colorBrush.SetColor(0xcccccc);
            d2d.FillRoundedRectangle(x, y+(16*i), x+PropertyMenu.instance.width-2, y+16*(i+1), 2, 2, colorBrush);
            colorBrush.SetColor(229/255, 229/255, 229/255);
            d2d.DrawRoundedRectangle(x, y+(16*i), x+PropertyMenu.instance.width-2, y+16*(i+1), 2, 2, colorBrush, 2, roundStrokeStyle);

            if(this.vCBE.textlayout.text != this.vCBE.value) {
                this.vCBE.textlayout.Release();
                this.vCBE.textlayout = d2d.CreateTextLayout(this.vCBE.value, font, w, h);
            }
    
            colorBrush.SetColor(0.0, 0.0, 0.0);
            
            if(Editable.edited == this.vCBE) {
                //const t = d2d.CreateTextLayout(this.value.slice(0, Editable.caret), font, 100, 16);
                //const {widthIncludingTrailingWhitespace} = t.GetMetrics(); //if there are trailing spaces it doesn't show that and it's weird
    
                
                const hit = this.vCBE.textlayout.HitTestTextPosition(Editable.caret, false); //who knew this function's main purpose was this use case
                //print(hit.x, hit.hitTestMetrics.width);
                const caretX = hit.x+x; //plus 4 because im drawing the text 4 pixels away from 0
                const caretY = hit.y+y+(16*i);
    
                
                //const pos = ; //lowkey might have to make a text layout to see how wide each character is
                d2d.DrawLine(caretX, caretY, caretX, caretY+16, colorBrush, 1, roundStrokeStyle);
                //t.Release();
            }
            d2d.DrawTextLayout(x, y+(16*i), this.vCBE.textlayout, colorBrush);    
        }
    }

    hittest(mouse, y) {
        let i = 0;
        for(const key in Blueprint.variables) {
            const bpv = Blueprint.variables[key];
            if(bpv.editing) continue; //we draw the edited one later
            //draw it
            if(withinBounds({x: 2, y: y+24+(i*16), width: PropertyMenu.instance.width-2, height: 16}, mouse)) {
                const tempobjectthatmakesmecringe = { //this is weird but valid i guess lol
                    buttonDown: function(mouse) {
                        VariableDropdownMenu.selected = bpv;
                    }
                }
                return [BUTTON, tempobjectthatmakesmecringe];
            }
            i++;
        }
        if(this.vCBE) {
            const ty = y+24+(this.vCBE.i*16); //this y (*16 is padding)
            //print(mouse, 2, ty);
            if(withinBounds({x: 2, y: ty, width: PropertyMenu.instance.width-2, height: 16}, mouse)) {
                const i = this.vCBE.textlayout.HitTestPoint(mouse.x, mouse.y).hitTestMetrics.textPosition;
                return [TEXT, [i, this.vCBE]]; //we'll calculate that later :)
            }
        }
    }
}

class PropertyMenu { //lowkey this might be a singleton too because im only going to make one of these
    x = 800
    y = 0
    width = 200
    height = h;
    sticky = true;

    static instance = undefined;

    dropdownMenus = [];

    static create() {
        PropertyMenu.instance = new PropertyMenu();
        panes.push(PropertyMenu.instance);
    }

    static removeOldDetailMenu() {
        if(!(PropertyMenu.instance.dropdownMenus[0] instanceof VariableDropdownMenu)) { //checking if dropdownMenus[0] is not a VariableDropdownMenu
            PropertyMenu.instance.dropdownMenus[0].destroy();
            PropertyMenu.instance.dropdownMenus.splice(0, 1);
        }
        dirty = true; //;)
        //VariableDropdownMenu.editing = false; //just in case (even though i probably won't use this property)
        //VariableDropdownMenu.selected = undefined;
    }

    static addVariableDetails() {
        PropertyMenu.removeOldDetailMenu();
        PropertyMenu.instance.dropdownMenus.splice(0, 0, new VariableDetailDropdownMenu(PropertyMenu.instance.height/(PropertyMenu.instance.dropdownMenus.length+1))); //oih yheah (+1 since we adding this one)
        Blueprint.active = undefined;
    }

    static addFunctionDetails() {
        PropertyMenu.removeOldDetailMenu();
        PropertyMenu.instance.dropdownMenus.splice(0, 0, new FunctionDetailDropdownMenu(PropertyMenu.instance.height/(PropertyMenu.instance.dropdownMenus.length+1))); //oih yheah (+1 since we adding this one)
        VariableDropdownMenu.editing = false;
        VariableDropdownMenu.selected = undefined;
    }

    constructor() {
        this.dropdownMenus.push(
            //new VariableDetailDropdownMenu(300),
            //new DetailDropdownMenu(300),
            new VariableDropdownMenu(this.height/2),
            //new PropertyDropdownMenu("Details", 300),
            //new PropertyDropdownMenu("Variables", 300, {buttonDown: function(mouse) {
            //    print("make new variable bruh");
            //}}),
        )
    }

    redraw() {
        colorBrush.SetColor(0x606060); //#606060 (96, 96, 96)
        d2d.FillRectangle(0, 0, this.width, this.height, colorBrush); //oops i forgot it was local and put this.x, this.y, this.x+this.width, this.y+this.height
        
        let y = 0;
        for(const dropdown of this.dropdownMenus) {
            colorBrush.SetColor(48/255, 48/255, 48/255);
            d2d.FillRoundedRectangle(2, y, this.width-2, y+24, 2, 2, colorBrush); //title bar
            colorBrush.SetColor(62/255, 62/255, 62/255);
            if(dropdown.open) {
                d2d.FillRoundedRectangle(2, y+24, this.width-2, y+dropdown.height-2, 1, 1, colorBrush); //contents
                //draw contents
                dropdown.drawcontents(2, y+24);
            }
            colorBrush.SetColor(62/255, 62/255, 62/255);
            if(dropdown.button) {
                //dropdown.button.redraw();
                d2d.FillRoundedRectangle(this.width-4-20, y+3, this.width-4, y+18+3, 1, 1, colorBrush); //button
            }
            colorBrush.SetColor(229/255, 229/255, 229/255);
            d2d.DrawTextLayout(2, y, dropdown.name, colorBrush);
            //d2d.DrawText(dropdown.name, font, 2, y, this.width, y+24, colorBrush);    
            y += dropdown.getHeight();
        }
    }

    hittest(mouse) {
        if(mouse.x < 10) {
            return [LEFT];
        }else {
            let y = 0;
            for(const dropdown of this.dropdownMenus) {
                //dropdown.mango.!:?
                //const {width} = dropdown.name.GetMetrics(); //nevermind lol
                const dropdownheight = dropdown.getHeight();
                if(withinBounds({x: 2, y, width: this.width-2, height: dropdownheight}, mouse)) {
                    if(dropdown.button && withinBounds({x: this.width-4-20, y, width: 20, height: 18}, mouse)) {
                        return [BUTTON, dropdown.button];
                    }else if(withinBounds({x: 2, y, width: this.width-2, height: 24}, mouse)) {
                        return [BUTTON, dropdown];
                    }else {
                        const ht = dropdown.hittest(mouse, y);
                        if(ht) {
                            return ht;
                        }
                        //yk...
                    }
                }
                y += dropdownheight;
            }
        }
        return [NULL];
    }

    onDrag() {
        this.windowResized(w, h);
    }

    windowResized(oldw, oldh) {
        this.x *= w/oldw;
        this.width = w-this.x;
        this.height *= h/oldh;
        for(const dropdown of this.dropdownMenus) {
            dropdown.height = this.height/this.dropdownMenus.length;
            dropdown.resize?.();
        }
    }

    destroy() {
        for(const dropdown of this.dropdownMenus) {
            dropdown.name.Release();
        }
    }
}

function parseCommandList() {
    //lowkey GetForegroundWindow and FindWindow should be pure
    function registerFunc(name, signature, desc) {
        let startI = signature.indexOf("(")+1;
        let endI = signature.indexOf(")");
        let parameters = signature.slice(startI, endI).split(",");
        let outstr = signature.slice(endI+1);

        //print(parameters, out);
        let out = outstr.match(typeRegex)?.[2];

        if(!Blueprint.paramColors[out]) {
            if(out.includes("void")) {
                out = [];
            /*}else if(out.includes('wstring')) {
                out = out.replaceAll("wstring", "string"); //lol
            */}else {
                const nameandparam = out.split(" |")[0].trimEnd();
                out = [`${nameandparam} : ${nameandparam}`];
                print(name, outstr, "o;", out, out.length);
            }
        }else {
            out = [`${out} : ${out}`]
        }

        for(let i = 0; i < parameters.length; i++) {
            //oops some parameters are like HWND | number so im stripping the ' |'
            //and also some are just (void)
            if(parameters[i] == "void") {
                parameters.splice(i, 1);
                i--; //i literally just had this thought that maybe if i decrement i after removing an element we'd be good...
            }else {
                parameters[i] = parameters[i].split(" |")[0].trimEnd(); //just in case
            }
        }

        BlueprintMenu.commandList.push({name, desc, parameters, out});
    }
    let extension = system("curl -i https://raw.githubusercontent.com/MagicQuest/JBS3Extension/refs/heads/main/src/extension.ts").split("\n"); //well i would use fetch but right now it only works with HTTP bruh
    //print(extension, typeof(extension), !!extension);
    if(extension.length == 1) {
        //lol my internet stopped working so im gonna make it read from my disk instead
        extension = require("fs").read("D:/scripts/vs-extensim/src/extension.ts").split("\n"); //ignore the path's mispelling of extension
    }
    for(const line of extension) {
        if(line.includes("registerFunc")) {
            try {
                eval(line); //im using eval here instead of regex so i can hijack registerFunc
            }catch(e) {
                print(e.toString());
            }
        }
    }
}

let w = 800+200; //200 for right menu
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

function saveBlueprintsJSON() {
    //ouuuuuhhhh this might be kinda hard... (hold on i got it)
    //i also want to be able to copy and paste them (maybe with the real clipboard / program)
    let bpids = {};
    let json = {variables: {}, blueprints: []};
    for(const varname of Object.keys(Blueprint.variables)) {
        const $var = Blueprint.variables[varname];
        json.variables[varname].type = $var.type;
        json.variables[varname].defaultvalue = $var.defaultvalue;
        //no textlayout because you can't save that lol and i'll just create it again
    }

    //first loop to establish ids
    let i = 0;
    for(const pane of panes) {
        if(pane instanceof Blueprint) {
            //json.blueprints.push();
            bpids[pane] = i;
            i++;
        }
    }

    for(const pane of panes) {
        if(pane instanceof Blueprint) {
            const object = {
                title: pane.title,
                x: pane.x,
                y: pane.y,
                //probably not gonna store the size because im probably gonna have to create them again anyways
                parameters: [], //control values
                id: bpids[pane], //just in case (just now realizing that i write "just in case" a lot)
                connections: {
                    in: [],
                    out: [],
                }
            };
            //not writing down the types of these parameters since im probably gonna create the blueprint again and it'll already know all that probably
            for(let i = 0; i < pane.parameters.length; i++) {
                const {type, text, control} = pane.parameters[i];
                
                if(control) {
                    object.parameters[i] = {control: {value: control.value}};
                }
                
                const maybepin = pane.connections.in[i];
                if(maybepin) {
                    if(type == "exec") {
                        object.connections.in[i] = {};
                        for(const key in maybepin) {//of Object.keys(maybepin)) { //oh wait i forgot that `in` does the same thing as `of Object.keys(...)`
                            const pin = maybepin[key];
                            object.connections.in[i][key] = {
                                i: pin.i,
                                source: bpids[pin.source],
                                id: pin.id,
                            };
                        }
                    }else {
                        object.connections.in[i] = {
                            i: maybepin.i,
                            source: bpids[maybepin.source],
                            id: maybepin.id,
                        };
                    }
                }
            }

            for(let i = 0; i < pane.out.length; i++) {
                const maybepin = pane.connections.out[i];
                if(maybepin) {
                    object.connections.out[i] = {};
                    for(const key in maybepin) {//of Object.keys(maybepin)) {
                        const pin = maybepin[key];
                        object.connections.out[i][key] = {
                            receiver: {
                                i: pin.receiver.i,
                                source: bpids[pin.receiver.source],
                                id: pin.receiver.id,
                            }
                        }
                    }
                }
            }
            
            json.blueprints.push(object);
        }
    }
    //print(json);
    return JSON.stringify(json);
}

function parseBlueprintsJSON(str) {
    const bpids = {};
    const json = JSON.parse(str); // {variables : [], blueprints: []}
    for(const varname in json.variables) {
        const $var = json.variables[varname];
        Blueprint.variables[varname] = $var;
        Blueprint.variables[varname].textlayout = d2d.CreateTextLayout(varname, font, w, h); //oh yeah
    }

    //create em yk
}

function executeBlueprints() {
    //assuming panes[0] is the event start blueprint because it's the first one i make
    const start = panes[0];
    //                         it's out[1] now because of the delegate pin             the first 'i' is the index of the out pin (why?)
    let current = start.connections.out[1]?.[0]?.receiver?.source; //connections.out : Array<{i : number, receiver : {i : number, source : Blueprint}}>

    next = undefined;
    loopStack = []; //hell yeah a stack!
    //print(start.connections.out[0]);
    //start.connections.out[0] //we can assume that for every object connected from event start has an exec pin as the first out pin
    //print(recur(start.connections));
    print("spacebar exec");
    
    const globalcache = {};
    
    for(const pane of panes) {
        //if(pane instanceof Blueprint) pane._special = false;
        (pane instanceof Blueprint) && (pane._special = false);
    }

    for(const key in Blueprint.variables) {
        //const var of
        Blueprint.variables[key].value = Blueprint.variables[key].defaultvalue;
    }

    //recur(start.connections);

    function interpretParametersAndExecute(source) { //holy MOlY i just learned the pure functions DON'T cache their result! https://raharuu.github.io/unreal/blueprint-pure-functions-complicated/
        //source._special = false;
        const args = [];
        const notpure = source.type == BPTYPE_NOTPURE;
        const j = (notpure || source.parameters[0]?.type == "exec") ? 1 : 0;
        const paneIndex = panes.indexOf(source);
        let result;
        let cache;
        if(loopStack.length > 0) {
            cache = loopStack.at(-1).cache;
        }else {
            cache = globalcache;
        }
        if(!cache[paneIndex]?.value || current == source) { //if we're interpreting the current pin then we'll execute it anyways since that seems reasonable
            for(let i = j; i < source.parameters.length; i++) {
                const param = source.parameters[i];
                let val = 0;
                //const cachedData = cache[paneIndex];
                //if(!cachedData?.[i]) { //if cachedData is undefined or (?.) if cachedData[i] is undefined
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
                        //if(inpin.source.type == BPTYPE_BARE && Blueprint.variables[inpin.source.title]) {
                        if(inpin.source.variable) { //lowkey just gonna put this on here
                            val = inpin.source.variable.value;
                        }else {
                            val = interpretParametersAndExecute(inpin.source);
                        }
                            //}
                    }else if(param.control) {
                        val = param.control.value;
                    }
                    //}else if(param == "string") {
                    //    val = "";
                    //}

                //    if(notpure) {
                //        if(!cachedData) {
                //            cache[paneIndex] = {};
                //        }
                //        cache[paneIndex][i] = val;
                //    }
                //}else {
                //    print(`using cached parameter ${i} for ${source.title}`)
                //    val = cachedData[i];
                //}
                args.push(val);
            }
            //return args;
            //if this is a datatype blueprint then don't do this lmao
            print("exec", source.title);
            print("args", args);
            if(source.variable) {
                result = Blueprint.meta_functions["SET"].call(source, ...args); //had to do it special bruh
            }else if(Blueprint.meta_functions[source.title]) {
                result = Blueprint.meta_functions[source.title].call(source, ...args);
            }else {
                const split = source.title.split(".");
                if(split.length > 1) {
                    //oh wait i guess you could recursively get the objetct and then call it like
                    let object = globalThis;
                    for(const name of split) {
                        object = object[name];
                    }
                    result = object(...args);
                    //const evalstr = `globalThis`;
                    //for(const name of split) {
                    //    evalstr += `.${name}`;
                    //}
                    //evalstr += `(...args)`;
                    //result = eval(evalstr);
                }else {
                    result = globalThis[source.title](...args); //lowkey im just gonna name the branch function like IF or something so i can just define it earlier (ok i did it differently than that)
                }
            }
            if(notpure) {
                if(!cache[paneIndex]) {
                    cache[paneIndex] = {};
                }
                cache[paneIndex].value = result;
                source._special = true;
                dirty = true; //lol
            }
        }else {
            print(`using cache[paneIndex].value for ${source.title} (${paneIndex})`);
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
        next = current.connections.out[0]?.[0]?.receiver?.source; //defining it like this so i can modify next in the interpret function (for blueprints like )
        print(current.title);
        interpretParametersAndExecute(current);

        print(!!next ? "cont" : "no futher", loopStack.length);
        if(!next && loopStack.length != 0) {
            const loop = loopStack.at(-1);
            next = loop.source;
            loop.cache = {}; //clear the cache my boy
            print("loop");
        }
        
        //damn i am not ready for these meta blueprints how am i gonna make the branch work...
        current = next; //traverse to the next blueprint connected
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
        let x = pane.x;
        let y = pane.y;
        if(!pane.sticky) {
            x+=camera.x;
            y+=camera.y;
        }
        d2d.SetTransform(Matrix3x2F.Translation(x, y));
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
            print(r, "throwaway release still has references!!!");
        }
    }
    throwawayObjects = []; //SHOULD be garbage collected
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

        parseCommandList();

        //gl = createCanvas("gl", NULL, hwnd);
        
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
        //let size = Blueprint.getAppropriateSize("SetWindowText", ["window : HWND", "text : string"], ["success : BOOL"], BPTYPE_NOTPURE);
        //print(size);
        //Blueprint.create(hwnd, "SetWindowText", [120/255, 168/255, 115/255], 300, 300, size.width, size.height, ["window : HWND", "text : string"], ["success : BOOL"], BPTYPE_NOTPURE);
        Blueprint.create(hwnd, "SetWindowText", 300, 300, ["window : HWND", "text : string"], ["success : BOOL"], BPTYPE_NOTPURE);
        panes.push(new Blueprint(hwnd, "SetWindowText", [120/255, 168/255, 115/255], 300, 300, 221, 105, ["window : HWND", "text : string"], ["success : BOOL"], BPTYPE_NOTPURE));
        panes.push(new Blueprint(hwnd, "GetWindowText", [120/255, 168/255, 115/255], 300, 300, 221, 105, ["window : HWND"], ["text : string"], BPTYPE_PURE));
        //size = Blueprint.getAppropriateSize("GetConsoleWindow", [], ["console : HWND"], BPTYPE_NOTPURE);
        //Blueprint.create(hwnd, "GetConsoleWindow", [120/255, 168/255, 115/255], 400, 400, size.width, size.height, [], ["console : HWND"], BPTYPE_NOTPURE);
        Blueprint.create(hwnd, "GetConsoleWindow", 400, 400, [], ["console : HWND"], BPTYPE_NOTPURE);
        panes.push(new Blueprint(hwnd, "GetConsoleWindow", [120/255, 168/255, 115/255], 400, 400, 150, 64, [], ["console : HWND"], BPTYPE_NOTPURE));
        panes.push(new Blueprint(hwnd, "FindWindow", [120/255, 168/255, 115/255], 400, 400, 150, 90, ["className? : string", "windowTitle : string"], ["window : HWND"], BPTYPE_PURE));
        panes.push(new Blueprint(hwnd, "version", [251/255, 0/255, 209/255], 400, 400, 150, 64, [], ["version : string"], BPTYPE_PURE));
        panes.push(new Blueprint(hwnd, "Program", [95/255, 150/255, 187/255], 300, 100, 221, 90*2, ["fragmentShader : FRAGMENT_SHADER", "vertexShader : VERTEX_SHADER"], [], BPTYPE_NOTPURE));
        panes.push(new Blueprint(hwnd, "Shader", [120/255, 168/255, 115/255], 0, 100, 221, 90, ["filename : string", "type : number"], ["shader : SHADER"], BPTYPE_PURE));
        panes.push(new Blueprint(hwnd, "print", [95/255, 150/255, 187/255], 500, 500, 150, 90, ["In String : string"], [], BPTYPE_NOTPURE));
        panes.push(new Blueprint(hwnd, "Beep", [120/255, 168/255, 115/255], 100, 500, 200, 130, ["frequency : number", "durationMs : number", "nonblocking? : boolean"], ["success : BOOL"], BPTYPE_NOTPURE));
        PropertyMenu.create();
        d2dpaint();
        SetTimer(hwnd, 0, 16); //lowkey this is only for BlueprintMenu smooth scrolling lmao
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
        //mouse.x -= camera.x;
        //mouse.y -= camera.y;
        //let result = 0;
        hit = {};
        //hitpane = undefined;
        for(const pane of panes) {
            const mca = {x: mouse.x, y: mouse.y}; //mouse camera adjusted
            if(!pane.sticky) {
                mca.x -= camera.x;
                mca.y -= camera.y;
            }
            if(withinBounds(pane, mca)) {
                //hitpane = undefined;

                const clientmouse = {x: mca.x-pane.x, y: mca.y-pane.y};
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
        
        if(BlueprintMenu.singleton && hit.pane != BlueprintMenu.singleton) { //hmmm i might need a custom array for these kinds of modal windows that go away when you click elsewhere
            BlueprintMenu.close();
        }
        if(DropdownControlMenu.instance && hit.pane != DropdownControlMenu.instance) {
            DropdownControlMenu.close();
        }
        if(Blueprint.active != hit.pane && (hit.pane instanceof Blueprint || hit.pane == undefined)) {
            if(Blueprint.active && PropertyMenu.instance.dropdownMenus[0] instanceof FunctionDetailDropdownMenu) { //lol
                PropertyMenu.removeOldDetailMenu();
            }
            Blueprint.active = undefined;
        }

        if(hit.result) {
            //if((hit.result & BUTTON) == BUTTON) {
            if(hit.result == BUTTON) {
                hit.data.buttonDown(mouse);
                activeButton = hit.data;
            }else //if((hit.result & MOVE) == MOVE) {
            if(hit.result == MOVE) {
                Draggable.select(hit.pane, mouse, false, false);
            }else if(hit.result == CONTEXTMENU || hit.result == WHEEL) {
                //no
            }else if(hit.result == DRAG) {
                if(GetKey(VK_MENU) && hit.pane instanceof Blueprint) {
                    const anyoutconnections = Object.values(hit.pane.connections.out[hit.data] ?? {});
                    if(anyoutconnections.length) {
                        for(const connection of Object.values(anyoutconnections)) {
                            const out = connection.receiver;
                            if(out.source.parameters[out.i].type == "exec") {
                                delete out.source.connections.in[out.i][out.id]; //oops i wrote out.data
                            }else {
                                out.source.connections.in[out.i] = undefined;
                            }
                        }
                    }
                    hit.pane.connections.out[hit.data] = undefined;
                }else {
                    Draggable.select(hit.pane.preDrag?.(mouse, hit.data) ?? hit.pane, mouse, false, false);
                }
            }else if(hit.result == DROP) {
                print(hit.data);

                if(hit.pane instanceof Blueprint) {
                    const inpin = hit.pane.connections.in[hit.data]; //{i, source, id}
                    const execpin = hit.pane.parameters[hit.data].type == "exec";
                    if((inpin && execpin && Object.keys(inpin).length) || (inpin && !execpin)) { //oops this if is cap
                        if(GetKey(VK_MENU)) {
                            if(execpin) {
                                for(const key of Object.keys(inpin)) {
                                    const pin = inpin[key];
                                    delete pin.source.connections.out[pin.i][pin.id];
                                }
                                hit.pane.connections.in[hit.data] = {};
                            }else {
                                delete inpin.source.connections.out[inpin.i][inpin.id];
                                hit.pane.connections.in[hit.data] = undefined;
                            }
                        }else {
                            //let obj;
                            let i, source, id;
                            if(execpin) {
                                const firstkey = Object.keys(inpin)[0];
                                //obj = inpin[firstkey];
                                i = inpin[firstkey].i;
                                source = inpin[firstkey].source;
                                id = inpin[firstkey].id;
                                delete inpin[firstkey];
                            }else {
                                //obj = inpin;
                                i = inpin.i;
                                source = inpin.source;
                                id = inpin.id;
                                hit.pane.connections.in[hit.data] = undefined;
                            }
                            //const {i, source, id} = obj;
                            Draggable.select(source.preDrag?.(mouse, i, id) ?? source, mouse, false, false);
                        }
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
            //if(pane.x <= mouse.x && pane.y <= mouse.y) { //bruh what i haven't been checking if it's within the size AND i've been decrementing mouse
            if(withinBounds(pane, mouse)) {
                //mouse.x -= pane.x;
                //mouse.y -= pane.y; //to client
                //hit |= pane.hittest(mouse);
                pane.mouseDown?.({x: mouse.x-pane.x, y: mouse.y-pane.y});
            }
        }

        if((hit.result != TEXT && hit.result != BUTTON) && Editable.editing) { //BUTTON is an exception here because there's only one time i use one and it's when you hit the new variable button in PropertyMenu
            Editable.endInput();
        }
    }else if(msg == WM_RBUTTONDOWN) {
        const mouse = {x: GET_X_LPARAM(lp)-camera.x, y: GET_Y_LPARAM(lp)-camera.y}; //lp is client mouse pos

        if(Editable.editing) {
            Editable.endInput(); //hahai have to end inpout here just in case i call BlueprintMenu.open
        }

        if(hit.result == BUTTON) {
            hit.pane.buttonRightMouseDown?.(mouse);
        }else if(hit.result == CONTEXTMENU) {
            const screenmousepos = GetCursorPos();
            hit.pane.preContextMenu?.(screenmousepos);
            TrackPopupMenu(hit.pane.contextMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, screenmousepos.x, screenmousepos.y, hwnd);
        }else if(!hit.result) {
            BlueprintMenu.open(hwnd);
        }

        for(const pane of panes) {
            if(withinBounds(pane, mouse)) {
                //mouse.x -= pane.x;
                //mouse.y -= pane.y; //to client
                //hit |= pane.hittest(mouse);
                pane.rightMouseDown?.({x: mouse.x-pane.x, y: mouse.y-pane.y});
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
                        receiver = {i: data, source: pane}; //id is just a random number
                        if(pane.parameters[data].type == "exec") {
                            receiver.id = draws;
                        }
                    }
                }
            }
    
            if(receiver) {
                                            //boy this is looking confusing...
                //oops i might have forgot, make sure you';re not connecting an exec pin to anmything lese
                let execpincheck = 0; //if execpincheck == 2 then they're both exec pins, if execpincheck == 0 then they're both not exec pins, but if execpincheck == 1 then you doing something wrong my boy
                execpincheck += (activePin.source.out[activePin.i].type == "exec");
                execpincheck += (receiver.source.parameters[receiver.i].type == "exec");
                if(execpincheck == 1) {
                    //hell nah you mixing exec pins and non exec
                    delete activePin.source.connections.out[activePin.i][activePin.id];
                }else {

                    /*if(activePin.source.out[activePin.i].type == "exec" || receiver.source.in[receiver.i].type == "exec") {
                        
                    }*/
                    activePin.source.connections.out[activePin.i][activePin.id].receiver = receiver; //{i: receiver.data, source: receiver.blueprint};
                    if(execpincheck != 2) {
                        const receiverpin = receiver.source.connections.in[receiver.i]; //{i, source, id}
                        if(receiverpin) { //if A was connected to B and C wants to connect to B, then i tell A that it's no longer connected
                            //this happens when something is already connected and you connect ANOTHER thing to this one
                            //receiverpin.source.connections.out[receiverpin.i] = undefined; //receiverpin.i (i think?)
                            delete receiverpin.source.connections.out[receiverpin.i][receiverpin.id];
                        }
                        receiver.source.connections.in[receiver.i] = activePin; //.source = activePin;
                    }else {
                        receiver.source.connections.in[receiver.i][receiver.id] = activePin;
                    }
                }
                //print(activePin.i, receiver.i);
            }else {
                //if(activePin.source.connections.out[activePin.i]?.receiver) { //moved into preDrag
                //    const receiver = activePin.source.connections.out[activePin.i].receiver;
                //    receiver.source.connections.in[receiver.i] = undefined;
                //    print(activePin.i, "prev", receiver.i);
                //}
                delete activePin.source.connections.out[activePin.i][activePin.id];// = undefined;
                if(activePin.source.out[activePin.i].type == "exec") {
                    BlueprintMenu.open(hwnd);
                }
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
        }else if(wp == " ".charCodeAt(0) && !Editable.editing) {
            if(GetKey(VK_SHIFT)) {
                executeBlueprints();
            }else {
                BlueprintMenu.open(hwnd);
            }
        }else if(wp == "S".charCodeAt(0) && GetKey(VK_CONTROL)) {
            print(saveBlueprintsJSON());
        }

        if(wp == VK_ESCAPE) {
            if(Editable.editing) Editable.endInput();
            if(BlueprintMenu.singleton) BlueprintMenu.close();
            if(DropdownControlMenu.instance) DropdownControlMenu.close();
        }
        if(Editable.editing && (wp > VK_SPACE || wp <= VK_DELETE)) {
            Editable.modify(wp);
        }

        if(Blueprint.active && !Editable.editing) {
            Blueprint.active.keyDown?.(wp);
        }
    }else if(msg == WM_CHAR) { //WM_CHAR will send the keycode of actual characters (like abc or !@#) but WM_KEYDOWN will send the keycode for every character BUT it won't send characters modified by shift (so if you hit shift+1 it will only send 1 instead of ! like WM_CHAR) also not to mention WM_KEYDOWN sends the capitalized keycode for letters (idk why)
        //so clearly i should've used WM_CHAR in jbstudio3.js
        if(Editable.editing && (wp != VK_RETURN && wp != VK_BACK && wp != 127) && wp > 31) { //for some reason ctrl+backspace puts this random character down (and windows controls always put it instead of backspacing words and it makes me mad)
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
    }else if(msg == WM_MOUSEWHEEL) {
        //print(wp, GET_WHEEL_DELTA_WPARAM(wp), lp); //ok no lie i had to make GET_WHEEL_DELTA_WPARAM for this
        if(hit.result == WHEEL) {
            hit.pane?.wheel(GET_WHEEL_DELTA_WPARAM(wp));
        }
        //if(dragging) {
        //            //oh yeah dragging is a string holding either cPos or c2Pos
        //    let i = +(dragging[1] == "2"); //if dragging[1] == "2" then dragging is c2Pos meaning the radii index must be 1
        //    radii[i] += (GET_WHEEL_DELTA_WPARAM(wp)*.0001);
        //    console.log(radii);
        //    gl.uniform2fv(uniformLocations["radii"], radii);
        //}
    }else if(msg == WM_TIMER) {
        if(Math.abs(BlueprintMenu.singleton?.scrollVelocity) > 0.01) { //Math.abs(undefined) == NaN
            dirty = true;
        }
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