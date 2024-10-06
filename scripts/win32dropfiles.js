const w = 800;
const h = 600;

let actualSize = {width: w, height: h};

let compatible;

let wic;

//const accept = [".png", ".jpg", ".jpeg", ".bmp", ".ico", ".gif", ".webp", ".tiff", ".dds", ".heic"]; //these are all the extentions i think wic supports (hold on i got a list here https://learn.microsoft.com/en-us/windows/win32/wic/-wic-about-windows-imaging-codec#native-codecs)
//oh shit it can actually load webp

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES
        const dc = GetDC(hwnd);
        compatible = CreateCompatibleBitmap(dc, screenWidth, screenHeight);//w, h); //before i just stretched the bitmap but i want it to be as big as the screen
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, compatible);
        //SelectObject(memDC, GetStockObject(DC_BRUSH)); //i always use the stock dc brush because i don't feel like creating my own brush and having to delete it >:P
        //SetDCBrushColor(memDC, GetSysColor(COLOR_BACKGROUND)); //oh wait i just realized why i was using GetSysColor... (COLOR_BACKGROUND IS a brush)
        FillRect(memDC, 0, 0, screenWidth, screenHeight, COLOR_BACKGROUND);
        DeleteDC(memDC);
        ReleaseDC(hwnd, dc);

        wic = InitializeWIC(); ScopeGUIDs(wic);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        
        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, compatible);
        //StretchBlt(ps.hdc, 0, 0, actualSize.width, actualSize.height, memDC, 0, 0, w, h, SRCCOPY);
        BitBlt(ps.hdc, 0, 0, actualSize.width, actualSize.height, memDC, 0, 0, SRCCOPY);
        DeleteDC(memDC);

        EndPaint(hwnd, ps);
    }else if(msg == WM_DROPFILES) { //according to this you can't drag and drop from a 32 bit app to a 64 bit one with WM_DROPFILES https://stackoverflow.com/questions/51204851/dragdrop-event-wm-dropfiles-in-c-gui
        print(wp, lp); //wp is the HDROP parameter we're looking for 👀
        const pt = DragQueryPoint(wp);
        print(pt);
        const files = DragQueryFile(wp, -1); //oh hell yeah'
        print(files);
        //const filenames = [];
        const dc = GetDC(hwnd);
        const memDC = CreateCompatibleDC(dc); //well damn using SetDIBits actually gets rid of this middleman (nevermind im still using StretchDIBits)
        SelectObject(memDC, compatible);
        for(let i = 0; i < files; i++) {
            //filenames[i] = DragQueryFile(wp, i);
            const filename = DragQueryFile(wp, i);
            print(filename);
            //if(accept.some((ext) => filename.endsWith(ext))) { //bruh i just said out loud "i think lua has some weird endsWith thing" but it was actually javascript instead...
                //write dumb code guys don't be like this guy
                //Array.some tests each value until one satisfies the predicate wherein it immediately returns true (lol wherein im saying bullshti)
                
                let bitmap;
                try {
                    bitmap = wic.LoadBitmapFromFilename(filename, wic.GUID_WICPixelFormat32bppPBGRA, 0); //ok i changed LoadBitmapFormFilename so that you can catch the error
                }catch(e) {
                    print(e);
                    continue;
                }
                print(bitmap);
                const dim = bitmap.GetSize();
                
                const compatibleForAlpha = CreateCompatibleBitmap(dc, dim.width, dim.height);
                SetDIBits(dc, compatibleForAlpha, 0, dim.height, bitmap.GetPixels(wic), CreateDIBitmapSimple(dim.width, -dim.height, 32), DIB_RGB_COLORS); //oh no im suddenly realizing that i can't specify WHERE these bits are going (no destX/destY :( ) //welcome back setdibits (jesus)
                let addx = (100-Math.random()*200)*(files>1); //that damn js coercion is incredible
                let addy = (100-Math.random()*200)*(files>1);

                const memDC2 = CreateCompatibleDC(dc);
                SelectObject(memDC2, compatibleForAlpha);
                
                AlphaBlend(memDC, pt.x+addx, pt.y+addy, dim.width, dim.height, memDC2, 0, 0, dim.width, dim.height, 255, AC_SRC_ALPHA);
                //StretchDIBits(memDC, pt.x+addx, pt.y+addy, dim.width, dim.height, 0, 0, dim.width, dim.height, bitmap.GetPixels(wic), dim.width, dim.height, 32, BI_RGB, SRCCOPY); //im using StretchDIBits {because i don't have SetDIBits-}(ok halfway through typing this i realized that yes, i have a form of SetDIBits (i say a form because i was actually thinking of SetDIBitsToDevice (which is the BitBlt of the DIBits world))) ok stretchdibits is back
                //ok dude don't get mad but im gonna have to use SetDIBits if i want alpha (by creating a 32bpp compatible bitmap, copying the bits into that, then alphablending to the spot i want to)
                DeleteDC(memDC2);
                bitmap.Release();
            //}
        }
        DeleteDC(memDC);
        ReleaseDC(hwnd, dc);

        //print(filenames);

        DragFinish(wp); //DragFinish to HDROP is as DeleteDC is to memDC (analogymaxxing)

        RedrawWindow(hwnd, 0, 0, actualSize.width, actualSize.height, NULL, RDW_INVALIDATE | RDW_UPDATENOW); //apparently i don't need updatenow?
    }else if(msg == WM_SIZE) {
        const [width, height] = [LOWORD(lp), HIWORD(lp)];
        actualSize = {width, height};
        RedrawWindow(hwnd, 0, 0, actualSize.width, actualSize.height, NULL, RDW_INVALIDATE | RDW_UPDATENOW); //apparently i don't need updatenow?
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0); //but it refused.
        wic.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "classic drop files (WM_DROPFILES) | drag and drop images onto the canvas!", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);

//let window;
//EnumWindows((hwnd) => {if(GetWindowText(hwnd).includes("classic drop files")) {window = hwnd}});
//let dc = GetDC(window)
//let memDC = CreateCompatibleDC(dc);
//let dib = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, -screenHeight, 32), DIB_RGB_COLORS);
//SelectObject(memDC, dib);
//BitBlt(memDC, 0, 0, screenWidth, screenHeight, dc, 0, 0, SRCCOPY);
//DeleteDC(memDC);
//ReleaseDC(window, dc);
//let bits = dib.GetBits();
//let str = "const bits = new Uint32Array([";
//(function() {for(let i = 0; i < bits.length; i++) { str+=`${bits[i]}, `; }})();
//str += "]);";
//require("fs").write("E:/Users/megal/source/repos/JBS3/scripts/win32dropfiles.txt", str);