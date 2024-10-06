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

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        StretchDIBits(ps.hdc, 0, 0, w, h, 0, 0, w, h, drawing, w, h, 32, BI_RGB, SRCCOPY);
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
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "shadereditor like renderdoc", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);