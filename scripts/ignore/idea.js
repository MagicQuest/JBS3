let w = 800;
let h = 600;

let wic, d2d, font, colorBrush, bitmapToBeTiled, tiledBitmapBrush;
let tabs = [];
let selectedTab;
let hit = {};
let draws = 0;
let dirty = false;
let window;

const get_lazy_fs = (function() {
    let fs = undefined;
    return () => {
        if(!fs) {
            fs = require("fs");
        }
        return fs;
    }
})();

function createBackgroundTiledBrush() { //snatched from /d2dbackgroundtiling.js
    const tileSize = 4*16; //8*16 gives you 8 spaces per tile
    
    bitmapToBeTiled = d2d.CreateBitmap(tileSize, tileSize); //bitmap to use with CreateBitmapBrush

    d2d.BeginDraw();

    colorBrush.SetColor(36/255, 36/255, 36/255);

    d2d.FillRectangle(0, 0, tileSize, tileSize, colorBrush);

    colorBrush.SetColor(64/255, 64/255, 64/255);

    for(let x = 0; x < tileSize/16; x++) {
        for(let y = 0; y < tileSize/16; y++) {
            //if((x == 0 || x == 2) && y % 2 == 1) {
            //if(x == 2 && y == 2) {
            //    d2d.FillEllipse(x*16 + 6, y*16 + 6, 6, 6, colorBrush);
            if(x % 2 == 0 || y % 2 == 0) {

            }else {
                d2d.FillEllipse(x*16 + 8, y*16 + 8, 2, 2, colorBrush);
            }
        }
    }

    d2d.EndDraw();

    bitmapToBeTiled.CopyFromRenderTarget(0, 0, d2d, 0, 0, tileSize, tileSize);

    tiledBitmapBrush = d2d.CreateBitmapBrush(bitmapToBeTiled);  
    tiledBitmapBrush.SetExtendMode(D2D1_EXTEND_MODE_WRAP, D2D1_EXTEND_MODE_WRAP);
}


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

function withinBounds({x, y, width, height}, pair) {
    return pair.x > x && pair.y > y && pair.x < x+width && pair.y < y+height;
}

function magnitude(vector) {
    return Math.sqrt(vector.x**2 + vector.y**2);
}

function changeMagnitude(vector, mag) {
    const old = magnitude(vector);
    vector.x *= mag/old;
    vector.y *= mag/old;
    return mag;
}

function somehowgetinputforrenaming() {
    return Inputbox("Enter the new name", "idea.js", "...");
}

const arrow = LoadCursor(NULL, IDC_ARROW);
const hand = LoadCursor(NULL, IDC_HAND);

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
    [BUTTON, hand], //[BUTTON, button : Object]
    [MOVE, LoadCursor(NULL, IDC_SIZEALL)], //[MOVE, [lockX : bool, lockY : bool]];
    [CONTEXTMENU, LoadCursor(NULL, IDC_HELP)],
    [DROP, hand],
    [DRAG, hand], //[DRAG, [data : any, lockX : bool, lockY : bool]];
    [TEXT, LoadCursor(NULL, IDC_IBEAM)],
    [WHEEL, LoadCursor(NULL, 32652)], //idk why 32652 isn't named
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
        Draggable.dragged.onDrag?.(); //we might keep this optional chain though
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

//interface (if this were java instead of javascript, i'd have a seperate Serializable interface instead of putting serialize functions in this "interface")
class IGeneric {
    windowResized(oldw, oldh) {

    }

    mouseDown(button, relative) {

    }

    mouseUp(button, relative) {

    }

    mouseWheel(wheel, relative) {

    }

    keydown(wp) {

    }

    isMouseOver(mouse) {

    }

    hittest(mouse) {

    }

    preDrag(mouse, data) {
        return this;
    }

    draw() {
        
    }

    serialize() {

    }

    deserialize(json) {

    }

    Release() {
        print(`IUnknown::Release called on ${this.constructor.name}!`);
    }
}

//abstract        implements
class Positionable extends IGeneric { //if this were java this would probably be an abstract class but i don't want it to extend IUnknown so how would i extend both on another object (the answer is: IUnknown should be an interface lol idk why it took writing it out for me to realize)
    //constructor(x, y, width, height) {
    //    this.transform(x, y, width, height);
    //}
    isMouseOver(mouse) {
        return withinBounds(this, mouse);
    }

    position(x, y) {
        this.x = x;
        this.y = y;
    }

    transform(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    size(width, height) {
        this.width = width;
        this.height = height;
    }
}

//interface (but javascript doesn't do implementing so i have to extend Positionable)
class Clickable extends Positionable {
    buttonDown(screenMouse) {

    }
}

//abstract
class Container extends Positionable {
    constructor(children = []) {
        super();
        this.children = children;
        this.childrenVisible = true;
        this.camera = {x: 0, y: 0};
    }

    hittest(mouse) {
        let ht;
        for(const child of this.children) {
            if(ht = child.hittest(mouse)) {
                break;
            }
        }
        return ht;
    }

    preDrag(mouse, data) {
        //should probably do stuff here with the children and all that
    }

    mouseDown(button, relative) {
        if(!this.childrenVisible) {
            return;
        }
        const offset = {x: relative.x-this.camera.x, y: relative.y-this.camera.y};
        //this.children.forEach(child => child.mouseDown(button, relative));
        for(const child of this.children) {
            if(child.isMouseOver(offset)) {
                child.mouseDown(button, offset);
            }
        }
    }

    mouseUp(button, relative) {
        if(!this.childrenVisible) {
            return;
        }
        const offset = {x: relative.x-this.camera.x, y: relative.y-this.camera.y};

        for(const child of this.children) {
            if(child.isMouseOver(offset)) {
                child.mouseUp(button, offset);
            }
        }
    }

    mouseWheel(wheel, relative) {
        //print("container:", wheel);
        if(!this.childrenVisible) {
            return;
        }
        const offset = {x: relative.x-this.camera.x, y: relative.y-this.camera.y};

        for(const child of this.children) {
            if(child.isMouseOver(offset)) {
                child.mouseWheel(wheel, offset);
            }
        }
    }

    draw() {
        if(!this.childrenVisible) {
            return;
        }
        this.children.forEach(child => child.draw());
    }

    deserialize(json) {
        this.camera = {x: json.camera.x, y: json.camera.y};
        for(const child of json.children) {
            this.children.push(this.deserializeChild(child));
        }
    }

    //abstract (must implement yourself)
    deserializeChild(json) {

    }

    serialize() {
        const data = {camera: this.camera, children: []};
        for(const child of this.children) {
            data.children.push(child.serialize());
        }
        return data;
    }

    Release() {
        this.children.forEach(child => child.Release());
        super.Release();
    }
}

//class TabView extends Container {
//    constructor(data) {
//        super();
//        this.transform(0, Tab.tabHeight, w, h);
//    }
//}

class Tab extends Container {
    static tabWidth = 216;
    static tabHeight = 30;
    static geometry = undefined;
    static outline = undefined;
    static selectedGradient = {brush: undefined, stopCollection: undefined};
    static unselectedGradient = {brush: undefined, stopCollection: undefined};
    static selectedColors = [[72/255, 72/255, 72/255], [102/255, 102/255, 102/255]];
    static unselectedColors = [[50/255, 50/255, 50/255], [69/255, 69/255, 69/255]];

    static initGeometry() {
        Tab.geometry = d2d.CreatePathGeometry();
        const sink = Tab.geometry.Open();

        sink.BeginFigure(Tab.tabWidth, Tab.tabHeight, D2D1_FIGURE_BEGIN_FILLED);
            //sink.AddLines(
            //    [
            //        0, 20
            //    ],
            //    [
            //        16, 0
            //    ],
            //    [
            //        200, 0
            //    ],
            //    [
            //        216, 20
            //    ]
            //);
            ////sink.AddLine(216, 20);
            //sink.AddLine(Tab.tabWidth-16, 0);
            //sink.AddLine(16, 0);
            //sink.AddLine(0, Tab.tabHeight);
            sink.AddBeziers(
                [
                    [Tab.tabWidth, Tab.tabHeight],
                    [Tab.tabWidth-4, Tab.tabHeight],//Tab.tabHeight * 3/4],
                    [Tab.tabWidth-8, Tab.tabHeight/2]
                ],
                [
                    [Tab.tabWidth-8, Tab.tabHeight/2],
                    [Tab.tabWidth-12, 0],
                    [Tab.tabWidth-16, 0],
                ]
            );
            //sink.AddBezier([Tab.tabWidth, Tab.tabHeight], [Tab.tabWidth-8, Tab.tabHeight/2], [Tab.tabWidth-16, 0]); //oh wait
            sink.AddLine(16, 0);
            //sink.AddBezier([16, 0], [8, Tab.tabHeight/2], [0, Tab.tabHeight]);
            sink.AddBeziers(
                [
                    [16, 0],
                    [12, 0],
                    [8, Tab.tabHeight/2],
                ],
                [
                    [8, Tab.tabHeight/2],
                    [4, Tab.tabHeight],//Tab.tabHeight * 3/4],
                    [0, Tab.tabHeight]
                ]
            );
        sink.EndFigure(D2D1_FIGURE_END_CLOSED);

        sink.Close();
        sink.Release();

        Tab.outline = d2d.CreatePathGeometry();
        const outlineSink = Tab.outline.Open();
        Tab.geometry.Outline(Matrix3x2F.Scale((Tab.tabWidth+2)/Tab.tabWidth, (Tab.tabHeight+2)/Tab.tabHeight, Tab.tabWidth/2, Tab.tabHeight/2), outlineSink);
        outlineSink.Close();
        outlineSink.Release();

        //const stopCollection = d2d.CreateGradientStopCollection([0.0, 0.0, 0.0, 0.0], [1.0, 36/255, 36/255, 36/255]);
        //Tab.gradient = {brush: d2d.CreateLinearGradientBrush(Tab.tabWidth, Tab.tabHeight, Tab.tabWidth-39, -70, stopCollection), stopCollection};

        let stopCollection = d2d.CreateGradientStopCollection([0.0, 81/255, 81/255, 81/255], [1.0, 68/255, 68/255, 68/255]);
        Tab.selectedGradient = {brush: d2d.CreateLinearGradientBrush(Tab.tabWidth/2, 0, Tab.tabWidth/2, Tab.tabHeight, stopCollection), stopCollection};
        
        stopCollection = d2d.CreateGradientStopCollection([0.0, 58/255, 58/255, 58/255], [1.0, 51/255, 51/255, 51/255]);
        Tab.unselectedGradient = {brush: d2d.CreateLinearGradientBrush(Tab.tabWidth/2, 0, Tab.tabWidth/2, Tab.tabHeight, stopCollection), stopCollection};
    }

    constructor(name) {//, data) {
        super();
        this.transform(0, 0, w, h); //Tab.tabWidth, Tab.tabHeight);
        this.tabPosition = {x: 0, y: 0, tabParent: this};
        ///this.name = name;
        //this.text = d2d.CreateTextLayout(name, font, Tab.tabWidth, Tab.tabHeight);
        //this.text.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
        this.setText(name);
        this.selected = false;
        this.childrenVisible = false;

        this.colors = Tab.unselectedColors;
        
        //this.topics = [];
        //if(data) {
            //somehow handle it?
        //}
    }

    setText(name) {
        if(this.text) {
            this.text.Release();
        }
        this.text = d2d.CreateTextLayout(name, font, Tab.tabWidth, Tab.tabHeight);
        this.text.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
        this.text.SetParagraphAlignment(DWRITE_PARAGRAPH_ALIGNMENT_CENTER);
    }

    open() {
        this.selected = true;
        this.childrenVisible = true;
        //this.size(w, h);
        //this.color = [243/255, 243/255, 243/255];
        this.colors = Tab.selectedColors;
    }

    close() {
        this.selected = false;
        this.childrenVisible = false;
        //this.size(Tab.tabWidth, Tab.tabHeight);
        //this.color = [218/255, 218/255, 218/255];
        this.colors = Tab.unselectedColors;
    }
    
    isMouseOverActualTab(mouse) {
        const maf = mouse.x-this.tabPosition.x;
        print(maf, this.tabPosition.x);
        return mouse.y < Tab.tabHeight && maf > 0 && maf < Tab.tabWidth;
    }

    hittest(mouse) {
        //const maf = mouse.x;
        //print(maf);
        //if(mouse.y < Tab.tabHeight && maf > 0 && maf < Tab.tabWidth) {
        if(this.isMouseOverActualTab(mouse)) {
            //return [MOVE, [false, true]];
            print("sending drag", this.tabPosition.x);
            return [DRAG, [undefined, false, true]];
        }else if(mouse.y < Tab.tabHeight) {
            return undefined;
        }
        if(this.selected) {
            return super.hittest({x: mouse.x-this.camera.x, y: mouse.y-this.camera.y}) ?? [NULL];
        }
    }

    preDrag(mouse, data) {
        if(this.isMouseOverActualTab(mouse)) {
            return this.tabPosition;
        }
        super.preDrag(mouse, data);
    }

    windowResized(oldw, oldh) {
        this.transform(0, 0, w, h);
    }

    draw() {
        d2d.SetTransform(Matrix3x2F.Translation(this.tabPosition.x, this.tabPosition.y));
        //colorBrush.SetColor(...this.color);
        d2d.FillGeometry(Tab.geometry, this.selected ? Tab.selectedGradient.brush : Tab.unselectedGradient.brush); //erm not teh double if check
        //colorBrush.SetColor(.7, .7, .7);
        colorBrush.SetColor(...this.colors[0]);
        d2d.DrawGeometry(Tab.outline, colorBrush);
        colorBrush.SetColor(...this.colors[1]);
        d2d.DrawGeometry(Tab.geometry, colorBrush);
        //colorBrush.SetColor(11/255, 2/255, 0);
        colorBrush.SetColor(44/255, 44/255, 44/255);
        d2d.DrawTextLayout(1, 1, this.text, colorBrush);
        colorBrush.SetColor(230/255, 230/255, 230/255);
        d2d.DrawTextLayout(0, 0, this.text, colorBrush);
        d2d.SetTransform(Matrix3x2F.Identity());
        if(this.selected) {
            //mustard respect button ----->
            d2d.PushLayer(new D2D1.LayerParameters(D2D1.RectF(this.x, this.y+Tab.tabHeight, w, h)));
            //colorBrush.SetColor(36/255, 36/255, 36/255);
            tiledBitmapBrush.SetTransform(Matrix3x2F.Translation(this.camera.x, this.camera.y));
            d2d.FillRectangle(0, 0, w, h, tiledBitmapBrush);
            d2d.SetTransform(Matrix3x2F.Translation(this.camera.x, this.camera.y));
            super.draw(); //draw children
            d2d.SetTransform(Matrix3x2F.Identity());
            d2d.PopLayer();
        }
    }

    mouseDown(button, relative) {
        if(this.isMouseOverActualTab(relative) && button == MK_RBUTTON) {
            const name = somehowgetinputforrenaming();
            if(name != "") {
                this.setText(name);
            }
        }
        super.mouseDown(button, relative);
    }

    keydown(wp) {
        const ctrl = GetKey(VK_CONTROL);
        if(wp == ' '.charCodeAt(0)) {
            if(ctrl) {
                this.camera = {x: 0, y: 0};
                dirty = true;
            }else {
                const mouse = GetCursorPos();
                ScreenToClient(window, mouse); //fun (returns nothing and modifies the object)

                const optional = showOpenFilePicker({
                    multiple: false,
                    excludeAcceptAllOption: true,
                    types: [
                        {
                            description: "Images",
                            accept: [".png", ".jpg", ".bmp", ".jpeg", ".ico"] //i can't be bothered to implement the mime types :sob:
                        }
                    ]
                });
                if(optional) {
                    const [path] = optional;
                    print(path);
                    this.children.push(new MainTopic(mouse.x-this.camera.x, mouse.y-this.camera.y, "Sample Text", path, this));
                    dirty = true;
                }
            }
        }
    }

    static fromJSON(json) {
        const ts = new Tab(json.text);
        ts.deserialize(json);
        return ts;
    }

    deserialize(json) {
        //this.prototype.constructor.deserialize()
        super.deserialize(json);
    }

    deserializeChild(childjson) {
        return Topic.fromJSON(childjson, this);
    }

    serialize() {
        //const data = super.serialize(); //no super because i don't want to save the child topics that are in this tab's children list
        const data = {camera: this.camera, children: []};
        for(const child of this.children) {
            if(child.isMain) {
                data.children.push(child.serialize());
            }
        }
        data.text = this.text.text;
        return data;
    }

    Release() {
        //this.geo.Release();
        for(const child of this.children) {
            if(child.isMain) {
                child.Release();
            }
        }
        this.text.Release();
        print(`custom IUnknown::Release called on Tab!`);
        //super.Release();
    }
}

class Topic extends Positionable {
    constructor(x, y, name, main, icon, parent, done = false) {
        super();
        this.parent = parent;
        this.done = done;
        const size = main ? 50 : 25;
        this.transform(x, y, size, size);
        //this.name = name;
        this.isMain = main;
        this.setText(name);
        //this.radius = 12;
        //this.text = d2d.CreateTextLayout(this.name, font, 50, 25);
        //this.text.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
        this.icon = {bitmap: undefined, path: ""};
        if(icon) {
            this.setIcon(icon);
        }
    }

    isMouseOver(mouse) {
        return magnitude({x: mouse.x-this.x, y: mouse.y-this.y}) < this.width;
    }

    hittest(mouse) {
        //oh boy we gotta do some vector bs because ts is a circle
        //const vector = {x: mouse.x-this.x, y: mouse.y-this.y};
        //if(magnitude(vector) < this.width) { //probably? (honestly it's crazy that i got this to work first try)
        //    return [MOVE, [false, false, this]];
        //}
        if(this.isMouseOver(mouse)) {
            return [MOVE, [false, false, this]];
        }
    }

    mouseDown(button, relative) {
        print("Topic mouse down");
        /*if(button == MK_RBUTTON) {
            //show teh context menu but we gotta make sum because idk we'll figure it out (ok wait i can't be bothered to do all that)
            //const menu = CreatePopupMenu();
            //InsertMenu(menu, 0, MF_BYPOSITION | MF_STRING, ID_SEX, "Rename?");
            //InsertMenu(menu, 0, MF_BYPOSITION | MF_STRING, ID_SEX, "Add child...");
            //TrackPopupMenu(menu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, relative.x, relative.y, window);
            
        }else if(button == MK_MBUTTON) {
            
        }else */if(button == MK_XBUTTON2) {
            const optional = showOpenFilePicker({
                multiple: false,
                excludeAcceptAllOption: true,
                types: [
                    {
                        description: "Images",
                        accept: [".png", ".jpg", ".bmp", ".jpeg", ".ico"] //i can't be bothered to implement the mime types :sob:
                    }
                ]
            });
            if(optional) {
                const [path] = optional;
                this.setIcon(path);
            }
        }else if(button == MK_RBUTTON) {
            const name = somehowgetinputforrenaming();
            if(name != "") {
                this.setText(name);
            }
        }else if(button == MK_XBUTTON1) {
            /*let index;
            if((index = this.parent.children.indexOf(this)) != -1) {
                this.parent.children.splice(index, 1);
                this.Release();
            }*/
           this.destroy();
        }
    }

    setText(name) {
        if(this.text) {
            this.text.Release();
        }
        this.text = d2d.CreateTextLayout(name, font, this.width, this.height/(this.icon?.path ? 2 : 1));
        this.text.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
        dirty = true;
    }

    setIcon(path) {
        if(this.icon.bitmap) {
            this.icon.bitmap.Release();
        }
        this.icon = {bitmap: d2d.CreateBitmapFromFilename(path, 0), path};
        dirty = true;
    }

    draw() {
        const div = this.done ? 2 : 1;
        colorBrush.SetColor(213/255, 243/255, 243/255, 0.5/div);
        d2d.FillEllipse(this.x, this.y, this.width, this.height, colorBrush);
        colorBrush.SetColor(213/255, 243/255, 243/255, 1.0/div);
        d2d.DrawEllipse(this.x, this.y, this.width, this.height, colorBrush);
        colorBrush.SetColor(D2D1.ColorF.White);
        d2d.DrawTextLayout(this.x-this.width/2, this.y-this.height, this.text, colorBrush);
        if(this.icon.bitmap) {
            // const calcX = this.x+(this.width/2);
            // const calcY = this.y+(this.height/2)+this.text.GetMetrics().height;
            const calcY = this.y; //+this.text.GetMetrics().height;
            // d2d.DrawBitmap(this.icon, calcX-12, calcY-12, calcX+12, calcY+12);
            d2d.DrawBitmap(this.icon.bitmap, this.x-16, calcY-16, this.x+16, calcY+16);
        }
    }

    static fromJSON(json, parent) {
        const ts = new (json.isMain ? MainTopic : ChildTopic)(json.x, json.y, json.text, json.icon, parent, json.done);
        if(json.radius) {
            ts.size(json.radius, json.radius);
            ts.setText(json.text); //calling set text to update it since the size might be different
        }
        ts.deserialize(json);
        return ts;
    }

    serialize() {
        return {icon: this.icon.path, text: this.text.text, x: this.x, y: this.y, done: this.done, radius: ((!this.isMain && this.width != 25) ? this.width : undefined)}; //i could set isMain but it would be redundant for the child topics
    }

    destroy() {
        this.Release();
    }

  //@Override
    Release() {
        this.text.Release();
        this.icon.bitmap?.Release();
        super.Release();
    }
}

class MainTopic extends Topic {
    constructor(x, y, name, icon, parent, done) {
        super(x, y, name, true, icon, parent, done);
        this.childTopics = [];
    }

    mouseDown(button, relative) {
        super.mouseDown(button, relative);

        if(button == MK_MBUTTON) {
            const child = new ChildTopic(relative.x, relative.y, "Sample Text", undefined, this);
            this.parent.children.push(child); //so it can be drawn
            this.childTopics.push(child); //so they can interact with each other
        }
    }

    destroy() {
        //for(const child of this.childTopics) {
        //    //const index = this.parent.children.indexOf(child);
        //    //if(index != -1) {
        //    //    this.parent.children.splice(index, 1);
        //    //}
        //    child.destroy();
        //}
        for(let i = this.childTopics.length-1; i >= 0; i--) { //gotta go backwards since im concurrently modifying my array (exception)
            this.childTopics[i].destroy();
        }
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
        super.destroy();
    }

    deserialize(json) {
        for(const child of json.childTopics) {
            const topic = Topic.fromJSON(child, this);
            this.parent.children.push(topic);
            this.childTopics.push(topic);
        }
    }
    
    serialize() {
        const data = super.serialize();
        data.isMain = true;
        data.childTopics = [];
        for(const child of this.childTopics) {
            data.childTopics.push(child.serialize());
        }
        return data;
    }

    Release() {
        for(const child of this.childTopics) {
            child.Release();
        }
        super.Release();
    }
}

class ChildTopic extends Topic {
    constructor(x, y, name, icon, parentTopic, done) {
        super(x, y, name, false, icon, parentTopic, done);
        this.velocity = {x: 0, y: 0};
    }

    mouseDown(button, relative) {
        super.mouseDown(button, relative);
        
        if(button == MK_LBUTTON) {
            this.done = !this.done;
        }
    }

    draw() {
        const offset = {x: this.x-this.parent.x+this.velocity.x, y: this.y-this.parent.y+this.velocity.y};
        const old = magnitude(offset);
        if(changeMagnitude(offset, old + (100/old)) > 100) {
            changeMagnitude(offset, 100);
        }
        this.x = offset.x + this.parent.x;
        this.y = offset.y + this.parent.y;
        this.velocity.x *= .95;
        this.velocity.y *= .95;
        d2d.DrawLine(this.parent.x, this.parent.y, this.x, this.y, colorBrush, 1);
        for(const child of this.parent.childTopics) {
            if(child == this) {
                continue;
            }
            //make sure we aren't touching any other top[ics] (somehow)
            //print(magnitude({x: child.x-this.x, y: child.y-this.y}));
            const vector = {x: child.x-this.x, y: child.y-this.y};
            let dist;
            if((dist = magnitude(vector)) < this.width+child.width) {
                colorBrush.SetColor(1.0, 0.25, 0.25, 0.5);
                d2d.FillEllipse(this.x, this.y, this.width, this.height, colorBrush, 1);
                const diff = (child.width+this.width) - dist;
                changeMagnitude(vector, diff);
                //print(diff, vector.x, vector.y);
                child.velocity.x += vector.x;
                child.velocity.y += vector.y;
            }
        }
        super.draw();
    }

    mouseWheel(wheel, mouse) {
        print(wheel/120, this.text.GetFontSize());
        const delta = wheel/120;
        this.size(this.width+delta, this.height+delta);
        this.setText(this.text.text);
        //this.radius = Math.max(this.radius + wheel/120, 0);
        //this.text.SetFontSize(this.radius);
    }

    destroy() {
        this.parent.childTopics.splice(this.parent.childTopics.indexOf(this), 1);
        print(this.parent.parent.children.indexOf(this));
        this.parent.parent.children.splice(this.parent.parent.children.indexOf(this), 1);
        super.destroy();
    }
}

function dispatchMouseEvent(event, mouse, arg) {
    for(const tab of tabs) {
        //if(pane.x <= mouse.x && pane.y <= mouse.y) { //bruh what i haven't been checking if it's within the size AND i've been decrementing mouse
        if(withinBounds(tab, mouse)) {
            //mouse.x -= pane.x;
            //mouse.y -= pane.y; //to client
            //hit |= pane.hittest(mouse);
            tab[event](arg, {x: mouse.x-tab.x, y: mouse.y-tab.y});
        }
    }
}

function selectTab(tab) {
    if(selectedTab) {
        selectedTab.close();
    }
    selectedTab = tab;
    selectedTab.open();
    dirty = true;
}

function updateTabPositions(draggedTab) {
    //re arrange based on positions (like if you just dragged one around)
    if(draggedTab) {
        const fromIndex = tabs.indexOf(draggedTab);
        const toIndex = Math.round(draggedTab.tabPosition.x/Tab.tabWidth);
        if(fromIndex != toIndex) {
            //we gotta move it
            tabs.splice(fromIndex, 1);
            tabs.splice(toIndex, 0, draggedTab);
        }
    }

    //actually set their positions based on their index in the tabs array
    for(let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        tab.tabPosition.x = i*(Tab.tabWidth-16);
    }
}

function d2dpaint() {
    d2d.BeginDraw();
    colorBrush.SetColor(0);
    d2d.FillRectangle(0, 0, w, h, colorBrush);
    //for(let i = tabs.length-1; i >= 0; i--) { //backwards for z-order
    //    const tab = tabs[i];
    //    tab.draw();
    //}
    for(const tab of tabs) {
        if(tab == selectedTab) {
            continue;
        }
        tab.draw();
    }
    selectedTab.draw();
    d2d.EndDraw();
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        window = hwnd;

        wic = InitializeWIC(); ScopeGUIDs(wic);
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd, wic);
        font = d2d.CreateFont(NULL, 12);
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);

        createBackgroundTiledBrush();

        Tab.initGeometry();

        tabs.push(new Tab("mustard", undefined));
        //print(tabs[0]);
        selectTab(tabs[0]);
        SetTimer(hwnd, NULL, 16);
    }else if(msg == WM_SIZE) {
        const oldw = w;
        const oldh = h;
        const wid = LOWORD(lp);
        const hei = HIWORD(lp);
        w = wid;
        h = hei;
        d2d.Resize(w, h);
        for(const tab of tabs) {
            tab.windowResized/*?.*/(oldw, oldh); //no question about it
        }
        dirty = true;
    }else if(msg == WM_LBUTTONDOWN) {
        SetCapture(hwnd);
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos

        if(hit.result) {
            if(hit.tab != selectedTab) {
                selectTab(hit.tab);
            }

            //if((hit.result & BUTTON) == BUTTON) {
            if(hit.result == BUTTON) {
                hit.data.buttonDown(mouse);
                //activeButton = hit.data;
            }else //if((hit.result & MOVE) == MOVE) {
            if(hit.result == MOVE) {
                Draggable.select(hit.data?.[2] ?? hit.tab, mouse, hit.data?.[0], hit.data?.[1]);
            }else if(hit.result == CONTEXTMENU || hit.result == WHEEL) {
                //no
            }else if(hit.result == DRAG) {
                Draggable.select(hit.tab.preDrag/*?.*/(mouse, hit.data?.[0]) ?? hit.tab, mouse, hit.data?.[1], hit.data?.[2]);
            }else if(hit.result == DROP) {
                print(hit.data);
            }else if(hit.result == TEXT) {
                //Editable.beginInput(hit.data[0], hit.data[1]); //haha i made hit.data = [i, object]
            }
            else {
                //const updown = ((hit.result & TOP) == TOP) || ((hit.result & BOTTOM) == BOTTOM);
                const updown = hit.result == TOP || hit.result == BOTTOM;
                Draggable.select(hit.tab, mouse, updown, !updown);
            }
        }

        //for(const tab of tabs) {
        //    //if(pane.x <= mouse.x && pane.y <= mouse.y) { //bruh what i haven't been checking if it's within the size AND i've been decrementing mouse
        //    if(withinBounds(tab, mouse)) {
        //        //mouse.x -= pane.x;
        //        //mouse.y -= pane.y; //to client
        //        //hit |= pane.hittest(mouse);
        //        tab.mouseDown(MK_LBUTTON, {x: mouse.x-tab.x, y: mouse.y-tab.y});
        //    }
        //}
        dispatchMouseEvent("mouseDown", mouse, MK_LBUTTON);
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture();
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos

        dispatchMouseEvent("mouseUp", mouse, MK_LBUTTON);

        //if(Draggable.dragged instanceof Tab) { //oh BOY! i was getting some GOOD use out of instanceof in Java
        if(Draggable.dragged?.tabParent) {
            //const tab = Draggable.dragged;
            //uhh reposition all tabs somehow
            updateTabPositions(Draggable.dragged.tabParent);
        }

        Draggable.mouseUp();
    }else if(msg == WM_RBUTTONDOWN) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos

        dispatchMouseEvent("mouseDown", mouse, MK_RBUTTON);
    }else if(msg == WM_RBUTTONUP) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos

        dispatchMouseEvent("mouseUp", mouse, MK_RBUTTON);
    }else if(msg == WM_MBUTTONDOWN) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos

        if(!Draggable.dragging) {
            SetCapture(hwnd);
            //const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos
            Draggable.select(selectedTab.camera, mouse, false, false);
        }

        dispatchMouseEvent("mouseDown", mouse, MK_MBUTTON);
    }else if(msg == WM_MBUTTONUP) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos

        ReleaseCapture();
        Draggable.mouseUp();

        dispatchMouseEvent("mouseUp", mouse, MK_MBUTTON);
    }else if(msg == WM_XBUTTONDOWN) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos
        const button = GET_XBUTTON_WPARAM(wp) == XBUTTON1 ? MK_XBUTTON1 : MK_XBUTTON2; //it actually just uses the HIWORD macro

        dispatchMouseEvent("mouseDown", mouse, button);
    }else if(msg == WM_XBUTTONUP) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos
        const button = GET_XBUTTON_WPARAM(wp) == XBUTTON1 ? MK_XBUTTON1 : MK_XBUTTON2; //it actually just uses the HIWORD macro

        dispatchMouseEvent("mouseUp", mouse, button);
    }else if(msg == WM_SETCURSOR) {
        const mouse = GetCursorPos();//{x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //i was originally using WM_MOUSEMOVE which passed the mouse position in the lp
        ScreenToClient(hwnd, mouse); //fun (returns nothing and modifies the object)
        //mouse.x -= camera.x;
        //mouse.y -= camera.y;
        //let result = 0;
        hit = {};
        //hitpane = undefined;
        for(const tab of tabs) {
            const mca = {x: mouse.x, y: mouse.y}; //mouse camera adjusted
            if(withinBounds(tab, mca)) {
                //hitpane = undefined;

                const clientmouse = {x: mca.x-tab.x, y: mca.y-tab.y};
                //mouse.x -= pane.x;
                //mouse.y -= pane.y; //to client (oops i was directly modifying mouse)
                const result = tab.hittest(clientmouse);
                if(result) {
                    const [legit, data] = result;
                    //hit |= legit; //lowkey i was just OR ing them together to make it easier
                    //if(legit != 0) {
                        hit.result = legit;
                        hit.tab = tab;
                        if(legit) {
                            //hitpane = legit == BUTTON ? data : pane;
                            hit.data = data;
                        }
                    //}
                }
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
    }else if(msg == WM_TIMER) {
        d2dpaint();
    }else if(msg == WM_KEYDOWN) {
        print(wp, lp, "ifurrgor");
        const ctrl = GetKey(VK_CONTROL);
        if(wp == "E".charCodeAt(0)) {
            print("e");
            if(ctrl) {
                SetForegroundWindow(GetConsoleWindow());
                try {
                    print(eval(getline("Ctrl+E -> Eval some code: ")));
                }catch(e) {
                    print(e.toString());
                }
                SetForegroundWindow(hwnd);
            }
        }else if(wp == "T".charCodeAt(0)) {
            const tab = new Tab("mustard", undefined);
            tabs.push(tab);
            selectTab(tab);
            updateTabPositions(undefined);
        }else if(wp == "S".charCodeAt(0)) {
            const path = showSaveFilePicker({
                //multiple: false,
                excludeAcceptAllOption: false,
                types: [
                    {
                        description: "*.json files",
                        accept: [".json"] //i can't be bothered to implement the mime types :sob:
                    }
                ]
            });
            if(path) {
                //print(optional);
                //const [path] = optional; //ouuuuhhh showSaveFilePicker returns the path directly so when i did this, path would only equal the first letter and that's why fs wasn't working

                const json = {tabs: []};
                for(const tab of tabs) {
                    json.tabs.push(tab.serialize());
                }
                print(json);
                print(get_lazy_fs().write(path, JSON.stringify(json), true)); //ok wait i don't think my version of fs.write will create the file if it doesn't exist so let's just use CreateFile (which i think i've only ever used once (it's kind of crazy that back in the day i used to use CLion and for some reason i couldn't get MSVC to compile with it, so i had to use mingw instead))
                //ok wait what i just said about fs.write not making a file is not true but for some reason it put the file in the wrong spot... (im just gonna use CreateFile anyways)
                //OK all the problems i had with fs were just because i forgot that showSaveFilePicker didn't return a list of paths!

                //const file = CreateFile(path, GENERIC_WRITE, FILE_SHARE_READ, OPEN_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
                //WriteFile(file, json, true);
                //CloseHandle(file);
            }
        }else if(wp == "O".charCodeAt(0)) {
            const optional = showOpenFilePicker({
                multiple: false,
                excludeAcceptAllOption: false,
                types: [
                    {
                        description: "*.json files",
                        accept: [".json"]
                    }
                ]
            });
            if(optional) {
                const [path] = optional;
                print("reading", path);
                const str = get_lazy_fs().read(path);
                if(str) {
                    tabs.forEach(tab => tab.Release());
                    tabs = []; //oops forgot to actually clear it lol

                    const json = JSON.parse(str);
                    print(json);
                    for(const tab of json.tabs) {
                        tabs.push(Tab.fromJSON(tab));
                    }
                    selectTab(tabs[0]);
                    updateTabPositions(undefined);
                }
            }
        }
        if(selectedTab) {
            selectedTab.keydown(wp);
        }
    }else if(msg == WM_MOUSEWHEEL) { //for some reason the mouse wheel function puts the screen mouse position through lp
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is for some reason NOT client mouse pos!
        ScreenToClient(hwnd, mouse); //NOW mouse holds the client pos;
        //print(mouse, GET_WHEEL_DELTA_WPARAM(wp));
        dispatchMouseEvent("mouseWheel", mouse, GET_WHEEL_DELTA_WPARAM(wp));
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        tabs.forEach(tab => tab.Release());
        Tab.geometry.Release();
        Tab.outline.Release();
        Tab.selectedGradient.brush.Release();
        Tab.selectedGradient.stopCollection.Release();
        Tab.unselectedGradient.brush.Release();
        Tab.unselectedGradient.stopCollection.Release();
        font.Release();
        d2d.Release();
        wic.Release();
    }

    if(Draggable.dragging) {
        const mouse = GetCursorPos();
        ScreenToClient(hwnd, mouse);
        //if(Draggable.dragged != camera) {
        //    mouse.x -= camera.x;
        //    mouse.y -= camera.y;
        //}
        Draggable.update(mouse);
    }

    if(dirty) {
        print("DIRTY!!!", Int_To_WM(msg), Math.random());
        d2dpaint();
        dirty = false;
        draws++;
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = arrow;

CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "idea", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);