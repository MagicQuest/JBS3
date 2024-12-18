//im using ID2D1DeviceContext so i can create a new bitmap to draw to
//if you want to create this tiled bitmap at runtime AND use ID2D1RenderTarget you could probably get away with drawing it to the screen and using CopyFromRenderTarget on a bitmap!

//for example...
const useDeviceContext = false;

let w = 800;
let h = 600;

const camera = {x: 0, y: 0, zoom: 1};

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
        //dirty = true;
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

let d2d, colorBrush, bitmap, tilingBrush;

const tileSize = 96;

function createTiledBitmapBrush() { //d2d HAS to be created with ID2D1DeviceContext or above because you can't get the targetBitmap/backBitmap OR use CreateBitmap1 and CreateBitmapFromDxgiSurface (now i could just make a png and keep using ID2D1RenderTarget but then i wouldn't be able to change the tileSize manually)
    //const tempRenderTarget = //i COULD make a new render target here OR i could use ID2D1DeviceContext's backBitmap render target (using a new bitmap or the backBitmap works exactly the same)
    
    const dashedStrokeStyle = d2d.CreateStrokeStyle(D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_LINE_JOIN_MITER, 100, D2D1_DASH_STYLE_DASH, 0, D2D1_STROKE_TRANSFORM_TYPE_NORMAL, NULL); //DASH_CAP_STYLE_) //oops didn't add DASH_CAP_STYLE_ to the extension yet
    
    bitmap = d2d.CreateBitmap(tileSize, tileSize); //bitmap to use with CreateBitmapBrush

    if(useDeviceContext) {
        //both of these are surprisingly valid ways of creating a bitmap that can be drawn to!
        //const tempRenderTarget = d2d.CreateBitmapFromDxgiSurface(D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW, DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED);
        const tempRenderTarget = d2d.CreateBitmap1(tileSize, tileSize, D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW, DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED, NULL, 0);
        
        d2d.SetTarget(tempRenderTarget); //drawing to the backBitmap so i can copy its contents (after i draw to it) into "bitmap" to use it with CreateBitmapBrush

        d2d.BeginDraw();

        colorBrush.SetColor(128/255, 128/255, 128/255);

        d2d.DrawRectangle(0, 0, tileSize, tileSize, colorBrush, 2, dashedStrokeStyle);

        colorBrush.SetColor(64/255, 64/255, 64/255);

        for(let i = 0; i < tileSize/16; i++) {
            d2d.DrawLine(i*16, 0, i*16, tileSize, colorBrush, 1, dashedStrokeStyle);
            d2d.DrawLine(0, i*16, tileSize, i*16, colorBrush, 1, dashedStrokeStyle);
        }

        d2d.EndDraw(true); //OH! i can't present it! (i'm pretty sure presenting switches the targetBitmap to what ever is currently selected)

        //bitmap.CopyFromRenderTarget(0, 0, d2d.backBitmap, 0, 0, tileSize, tileSize); //hell yeah (oh wait no for this to work you'd have to pass d2d)
        bitmap.CopyFromBitmap(0, 0, tempRenderTarget, 0, 0, tileSize, tileSize); //hell yeah

        d2d.SetTarget(d2d.targetBitmap);

        tempRenderTarget.Release(); //don't forget to release the new bitmap bruh (probably after you set the target to something else)

        //wait i wonder if i even need another bitmap or i could just use the render target bitmap directly
        //tilingBrush = d2d.CreateBitmapBrush(tempRenderTarget); //NO! "Cannot draw with a bitmap that has the D2D1_BITMAP_OPTIONS_CANNOT_DRAW option."
        //tilingBrush.SetExtendMode(D2D1_EXTEND_MODE_WRAP, D2D1_EXTEND_MODE_WRAP);
    }else {
        d2d.BeginDraw();

        colorBrush.SetColor(128/255, 128/255, 128/255);

        d2d.DrawRectangle(0, 0, tileSize, tileSize, colorBrush, 2, dashedStrokeStyle);

        colorBrush.SetColor(64/255, 64/255, 64/255);

        for(let i = 0; i < tileSize/16; i++) {
            d2d.DrawLine(i*16, 0, i*16, tileSize, colorBrush, 1, dashedStrokeStyle);
            d2d.DrawLine(0, i*16, tileSize, i*16, colorBrush, 1, dashedStrokeStyle);
        }

        d2d.EndDraw();

        bitmap.CopyFromRenderTarget(0, 0, d2d, 0, 0, tileSize, tileSize);
    }

    tilingBrush = d2d.CreateBitmapBrush(bitmap);  
    tilingBrush.SetExtendMode(D2D1_EXTEND_MODE_WRAP, D2D1_EXTEND_MODE_WRAP);

    dashedStrokeStyle.Release();
}

const arrow = LoadCursor(NULL, IDC_ARROW);

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
                            //ID2D1RenderTarget is 0
                            //ID2D1DeviceContext is 2
        //d2d = createCanvas("d2d", useDeviceContext*2, hwnd);
        if(useDeviceContext) {
            d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd);
        }else {
            d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        }
        //defaultBGG = d2d.CreateLinearGradientBrush(0,0,1,1,d2d.CreateGradientStopCollection([1.0, 204/255, 204/255, 204/255], [0.0, 178/255, 212/255, 1.0]));
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);

        createTiledBitmapBrush();

        SetTimer(hwnd, NULL, 16);
    }else if(msg == WM_TIMER) {
        const mouse = GetCursorPos();
        ScreenToClient(hwnd, mouse);
        //mouse.x -= camera.x;
        //mouse.y -= camera.y;

        //d2d.SetTransform(Matrix3x2F.Translation(camera.x, camera.y));

        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0);
        //d2d.DrawBitmap(bitmap, mouse.x, mouse.y, mouse.x+tileSize, mouse.y+tileSize);
        tilingBrush.SetTransform(Matrix3x2F.Translation(camera.x, camera.y)); //oh i thought it would be harder than this
        d2d.FillRectangle(0, 0, w, h, tilingBrush);
        d2d.EndDraw();
    }else if(msg == WM_MBUTTONDOWN) {
        if(!Draggable.dragging) {
            SetCapture(hwnd);
            const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //lp is client mouse pos
            Draggable.select(camera, mouse, false, false);
        }
    }else if(msg == WM_MBUTTONUP) {
        ReleaseCapture();
        Draggable.mouseUp();
    }else if(msg == WM_SIZE) {
        w = LOWORD(lp);
        h = HIWORD(lp);
        d2d.Resize(w, h); //hell yeah
    }
    else if(msg == WM_DESTROY) {
        print(tilingBrush.Release());
        print(bitmap.Release());
        print(colorBrush.Release());
        print(d2d.Release());
        PostQuitMessage(0);
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
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = arrow;//NULL; //LoadCursor(NULL, IDC_ARROW); //im using NULL here because im changing SetCursor myself here (nevermind i stopped using NULL because i handle the WM_SETCURSOR event and when i don't change the cursor i have DefWindowProc do the work)

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "background tiling for jbsblueprints test (scrub with middle mouse)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);