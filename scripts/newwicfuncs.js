let d2d;
let bitmaps = [];
let j = 0;
let frameCount;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        const wic = InitializeWIC();
        ScopeGUIDs(wic);
        //print(wic);
        print(wic.GUID_WICPixelFormat32bppPBGRA);
        const wicDecoder = wic.LoadDecoder(__dirname+"/sponge.gif"); //__dirname+"/faze/faze.gif"); //ok idk why but this faze gif doesn't work very well
        print(frameCount = wicDecoder.GetFrameCount(), "FRAME COUNT!");
        for(let i = 0; i < frameCount; i++) {
            const wicBitmap = wicDecoder.GetBitmapFrame(wic, i, wic.GUID_WICPixelFormat32bppPBGRA);
            bitmaps.push(d2d.CreateBitmapFromWicBitmap(wicBitmap, true)); //passing true as the second argument releases wicBitmap
        }
        wicDecoder.Release();
        //const wicBitmap = wic.LoadBitmapFromFilename(__dirname+"/faze/faze.gif", GUID_WICPixelFormat32bppPBGRA, 0); //third is optional if 0
        //bitmap = d2d.CreateBitmapFromWicBitmap(wicBitmap, true);
        wic.Release(); //after calling release any subsequent use of wic will result in error
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        //d2d.Clear(); //don't clear because gifs are weird?
        j = j % frameCount; //loops gif
        d2d.DrawBitmap(bitmaps[Math.floor(j)], 0, 0, 512, 512, 1.0);
        d2d.EndDraw();
        j += .5; //controls framerate of gif
    }else if(msg == WM_LBUTTONDOWN) {
        j = 0;
    }else if(msg == WM_MOUSEMOVE) {
        if((wp & MK_RBUTTON) == MK_RBUTTON) {
            //could use MAKEPOINTS but i don't need the y
            print(`scrubbing to ${(GET_X_LPARAM(lp)/GetClientRect(hwnd).right)*100}% of the video`);
            j = (GET_X_LPARAM(lp)/GetClientRect(hwnd).right)*frameCount; //scroll through gif like ffplay
        }
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

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "newwicfuncs.js - (left click to loop | hold right click to scrub)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+16, 512+39, NULL, NULL, hInstance);