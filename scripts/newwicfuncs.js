let d2d;
let bitmaps = [];
let j = 0;
let frameCount;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        const wic = InitializeWIC();
        ScopeGUIDs(this);
        print(wic);
        print(GUID_WICPixelFormat32bppPBGRA);
        const wicDecoder = wic.LoadDecoder(__dirname+"/sponge.gif"); //__dirname+"/faze/faze.gif"); //ok idk why but this faze gif doesn't work very well
        print(frameCount = wicDecoder.GetFrameCount(), "FRAME COUNT!");
        for(let i = 0; i < frameCount; i++) {
            const wicBitmap = wicDecoder.GetBitmapFrame(wic, i, GUID_WICPixelFormat32bppPBGRA);
            bitmaps.push(d2d.CreateBitmapFromWicBitmap(wicBitmap, true));
        }
        wicDecoder.Release();
        //const wicBitmap = wic.LoadBitmapFromFilename(__dirname+"/faze/faze.gif", GUID_WICPixelFormat32bppPBGRA, 0); //third is optional if 0
        //bitmap = d2d.CreateBitmapFromWicBitmap(wicBitmap, true);
        wic.Release(); //after calling release any subsequent use of wic will result in error
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        //d2d.Clear(); //don't clear because gifs are weird?
        j = j % frameCount;
        d2d.DrawBitmap(bitmaps[Math.floor(j)], 0, 0, 512, 512, 1.0);
        d2d.EndDraw();
        j += .5;
    }
    else if(msg == WM_DESTROY) {
        //bitmap.Release();
        PostQuitMessage(0);
        for(const bitmap of bitmaps) {
            bitmap.Release();
        }
        d2d.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "newwicfuncs.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+16, 512+39, NULL, NULL, hInstance);