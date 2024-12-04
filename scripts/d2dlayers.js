//lol i only added paths for the 2d rendering context

const w = 768;
const h = 512;

let wic, d2d, font, imagine, imagineBrush, colorBrush, layer, shapes;

let i = 0;

//fancy stuff for ScrollBox snatched from my jbsblueprints.js

let hit = {}; //{result, data, pane}

let panes = [];

function withinBounds({x, y, width, height}, pair) {
    return pair.x > x && pair.y > y && pair.x < x+width && pair.y < y+height;
}

function clamp(min, max, value) {
    return Math.min(Math.max(min, value), max);
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

const hand = LoadCursor(NULL, IDC_HAND);

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

class ScrollBox {
    contents = [];
    //scrollY = 0;
    //scrollYVelocity = 0;
    scroll = {}; //making it an object so i can drag it with Draggable!@
    x = 300;
    y = 200;
    width = 350;
    height = 300;

    constructor() {
        this.contents = Object.keys(globalThis); //idk just a random list of stuff
        for(let i = 0; i < this.contents.length; i++) {
            this.contents[i] = d2d.CreateTextLayout(this.contents[i], font, this.width, this.height); //for SPEED
        }
        this.rectangle = d2d.CreateRectangleGeometry(0, 0, this.width, this.height); //0, 0 since i set the transform before i call redraw
        this.scroll.y = 0;
        this.scroll.velocity = 0;
        this.scroll.scrollBarHeight = 20;
    }

    static instance = undefined;

    static open() {
        this.instance = new ScrollBox();
        panes.push(this.instance);
    }

    static close() {
        panes.splice(panes.indexOf(this.instance), 1);
        this.instance = undefined;
    }

    redraw() {
        colorBrush.SetColor(32/255, 32/255, 32/255);
        d2d.FillRectangle(0, 0, this.width, this.height, colorBrush);
        this.scroll.y += this.scroll.velocity;
        this.scroll.velocity *= .95;

        d2d.PushLayer(new D2D1.LayerParameters(D2D1.InfiniteRect(), this.rectangle)); //clips the text for meh
        colorBrush.SetColor(153/255, 135/255, 201/255); //(0xffffff);
        
        //unoptimized
        //for(let i = 0; i < this.contents.length; i++) { //Object.keys(globalThis) holds like ~3700 shits
        //    const text = this.contents[i];
        //    //d2d.DrawText(text, font, 0, (i-this.scrollY)*16, this.width, this.height, colorBrush);
        //    d2d.DrawTextLayout(0, (i-this.scrollY)*16, text, colorBrush); //text layout draws faster (wow it actually made a big difference)
        //}

        //optimized version
        const textheight = 16;
        for(let i = 0; i < (this.height/textheight)+1; i++) { //calculating how many i should draw based on the height of the text and the height of this object (adding + 1 so there isn't an empty space at the bottom sometimes)
            const j = Math.floor(this.scroll.y) + i; //calculating j by flooring scrollY
            const text = this.contents[j];
            if(text) d2d.DrawTextLayout(0, (i-(this.scroll.y%1))*textheight, text, colorBrush); //using the decimal point of scrollY for smooth scrolling :smirk:
        }
        d2d.PopLayer();

        const scrollbarY = (this.scroll.y/this.contents.length)*(this.height-this.scroll.scrollBarHeight); //-scrollBarHeight because that's how tall i've decided to make the scrollbar lol

        d2d.FillRectangle(this.width-12, scrollbarY, this.width-2, scrollbarY+this.scroll.scrollBarHeight, colorBrush);
    }

    preDrag(mouse, data) {
        const tempscrollobjecttohelpmedothis = {x: 0, y: this.scroll.y, onDrag: (function() {
            print(tempscrollobjecttohelpmedothis.y);
            this.scroll.y = clamp(0, this.contents.length, (tempscrollobjecttohelpmedothis.y/(this.height-this.scroll.scrollBarHeight))*this.contents.length); //! (subtracting height - scrollBarHeight so that the mouse doesn't slip away when you drag to the bottom!)
            //ok wait this kinda sucks idk imma do it right in jbsblueprints tho trust.
        }).bind(this)};
        return tempscrollobjecttohelpmedothis;
    }

    hittest(mouse) {
        const scrollbarY = (this.scroll.y/this.contents.length)*(this.height-20);
        if(withinBounds({x: this.width-12, y: scrollbarY, width: 10, height: this.scroll.scrollBarHeight}, mouse)) {
            return [DRAG]; //no data because im doing it kinda weird
        }
        return [WHEEL];
    }

    wheel(wp) {
        print(wp);
        const scrollY = -wp/120
        this.scroll.velocity += scrollY/5;
    }

    destroy() {
        for(const text of this.contents) {
            text.Release();
        }
    }
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC(); ScopeGUIDs(wic);
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd, wic);
        font = d2d.CreateFont(NULL, 12);
        imagine = d2d.CreateBitmapFromFilename(__dirname+"/imagine.bmp", 0);
        imagineBrush = d2d.CreateBitmapBrush(imagine);
        imagineBrush.SetExtendMode(D2D1_EXTEND_MODE_WRAP, D2D1_EXTEND_MODE_WRAP); //tiling
        imagineBrush.SetTransform(Matrix3x2F.Scale(.1, .1, imagine.GetSize().width/2, imagine.GetSize().height/2)); //smaller for more tiling lmao
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);
        //layer = d2d.CreateLayer(); //nowadays you don't have to create a layer yourself
        shapes = [
            d2d.CreateRectangleGeometry(D2D1.RectF(-25, -25, 25, 25)),
            d2d.CreateRoundedRectangleGeometry(D2D1.RoundedRect(-25, -25, 25, 25, 5, 5)),
            d2d.CreateEllipseGeometry(D2D1.Ellipse(0, 0, 25, 25)),
        ];

        ScrollBox.open();
        //circle = d2d.CreatePathGeometry(); //oh i just googled how to get an ellipse for path geometry but found out there is an easy function for ellipse geometryt
        //const sink = circle.Open();
        //sink.AddArc(10, 10, 10, 10,)
        //sink.Close();
        //sink.Release();

        print(imagineBrush, layer);

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        const mouse = GetMousePos();
        ScreenToClient(hwnd, mouse);

        d2d.BeginDraw();
        d2d.Clear(.2, .2, .2, .1);
        const trans = d2d.CreateTransformedGeometry(shapes[i], Matrix3x2F.Translation(mouse.x, mouse.y));
        //d2d.FillGeometry(trans, imagineBrush);
        d2d.PushLayer(new D2D1.LayerParameters(D2D1.InfiniteRect(), trans)); //, layer);
        d2d.FillRectangle(0, 0, w, h, imagineBrush);
        d2d.PopLayer();

        d2d.SetTransform(Matrix3x2F.Translation(ScrollBox.instance.x, ScrollBox.instance.y));
        ScrollBox.instance.redraw();
        d2d.SetTransform(Matrix3x2F.Identity());

        d2d.EndDraw();

        trans.Release();
    }else if(msg == WM_LBUTTONDOWN) {
        i = (i+1)%shapes.length;

        SetCapture(hwnd);
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos
        
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
                Draggable.select(hit.pane.preDrag?.(mouse, hit.data) ?? hit.pane, mouse, false, false);
            }else if(hit.result == DROP) {
                print(hit.data);
            }else if(hit.result == TEXT) {
                //Editable.beginInput(hit.data[0], hit.data[1]); //haha i made hit.data = [i, object]
            }
            else {
                //const updown = ((hit.result & TOP) == TOP) || ((hit.result & BOTTOM) == BOTTOM);
                const updown = hit.result == TOP || hit.result == BOTTOM;
                Draggable.select(hit.pane, mouse, updown, !updown);
            }
        }
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture();
        Draggable.mouseUp();
    }else if(msg == WM_SETCURSOR) {
        const mouse = GetCursorPos();//{x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //i was originally using WM_MOUSEMOVE which passed the mouse position in the lp
        ScreenToClient(hwnd, mouse); //fun (returns nothing and modifies the object)
        //mouse.x -= camera.x;
        //mouse.y -= camera.y;
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
    }else if(msg == WM_MOUSEWHEEL) {
        if(hit.result == WHEEL) {
            hit.pane?.wheel(GET_WHEEL_DELTA_WPARAM(wp));
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        for(const shape of shapes) {
            shape.Release();
        }
        ScrollBox.close();
        font.Release();
        //layer.Release();
        imagineBrush.Release();
        imagine.Release();
        colorBrush.Release();
        d2d.Release();
        wic.Release();
    }

    if(Draggable.dragging) {
        const mouse = GetCursorPos();
        ScreenToClient(hwnd, mouse);
        Draggable.update(mouse);
    }
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "d2d layers!", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);