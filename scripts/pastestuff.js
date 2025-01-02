//for some reason after hitting ctrl+c on the window and then pasting, it spits out random symbols (but if you open another pastestuff.js and paste, it works fine...)

let w = 800;
let h = 600;

let fonts = [];

let wic;

function DrawMyText(dc, {x, y}, text) {
    const [r, g, b] = [Math.floor(Math.random()*255), Math.floor(Math.random()*255), Math.floor(Math.random()*255)];
    //SetBkColor(dc, Math.floor(Math.random()*RGB(255, 255, 255))); //yeah probably
    //SetTextColor(dc, Math.floor(Math.random()*RGB(255, 255, 255)));
    SetBkColor(dc, RGB(r, g, b));
    SetTextColor(dc, RGB(255-r, 255-g, 255-b));
    SelectObject(dc, fonts[Math.floor(Math.random()*fonts.length)]);
    DrawText(dc, text, x, y, w, h, DT_LEFT);
}

function DrawMyBitmap(dc, {x, y}, hbm) {
    const {width, height} = GetBitmapDimensions(hbm);

    const memDC = CreateCompatibleDC(dc);
    SelectObject(memDC, hbm);
    BitBlt(dc, x, y, width, height, memDC, 0, 0, SRCCOPY);
    DeleteDC(memDC);
    //print(GetBitmapDimensions(hbm));
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC();
        ScopeGUIDs(wic);

        const dc = GetDC(hwnd);
        EnumFontFamilies(dc, function(font, textMetrics, type) {
            font.lfHeight = 24;
            font.lfWidth = 12;
            fonts.push(CreateFontIndirect(font));    
        });
        ReleaseDC(hwnd, dc);
    }else if(msg == WM_KEYDOWN) {
        if(wp == "V".charCodeAt(0) && GetKey(VK_CONTROL)) {
            //print("paste!");

            const mouse = GetCursorPos();
            ScreenToClient(hwnd, mouse);

            let dc = GetDC(hwnd);
            
            let success = OpenClipboard(hwnd); //gotta open clipboard to get le data out

            if(success) {
                if(IsClipboardFormatAvailable(CF_UNICODETEXT)) {
                    print("pasting from CF_UNICODETEXT!");
                    DrawMyText(dc, mouse, GetClipboardData(CF_UNICODETEXT));
                }else if(IsClipboardFormatAvailable(CF_TEXT)) {
                    print("pasting from CF_TEXT!");
                    DrawMyText(dc, mouse, GetClipboardData(CF_TEXT));
                }else if(IsClipboardFormatAvailable(CF_BITMAP)) {
                    print("pasting from CF_BITMAP!");
                    DrawMyBitmap(dc, mouse, GetClipboardData(CF_BITMAP));
                    //if an image is copied from some chromium browser im assuming they all add the UniformResourceLocatorW format
                    if(IsClipboardFormatAvailable(49301)) {
                        DrawMyText(dc, {x: mouse.x, y: mouse.y-24}, WStringFromPointer(GetClipboardData(49301)));
                    }
                }else if(IsClipboardFormatAvailable(CF_ENHMETAFILE)) {
                    print("pasting from CF_ENHMETAFILE"); //whatever that is
                    PlayEnhMetaFile(dc, GetClipboardData(CF_ENHMETAFILE), mouse.x, mouse.y, w, h);
                }else if(IsClipboardFormatAvailable(CF_HDROP)) {
                    const HDROP = GetClipboardData(CF_HDROP);
                    const len = DragQueryFile(HDROP, -1);
                    print(`pasting from CF_HDROP (${len} ${len == 1 ? "file" : "files"})!`);
                    for(let i = 0; i < len; i++) {
                        const filename = DragQueryFile(HDROP, i);
                        DrawMyText(dc, mouse, filename);
                        const wicBitmap = wic.LoadBitmapFromFilename(filename, wic.GUID_WICPixelFormat32bppPBGRA, 0);
                        const {width, height} = wicBitmap.GetSize();
                        const hbm = CreateBitmap(width, height, 32, wicBitmap.GetPixels(wic));
                        DrawMyBitmap(dc, mouse, hbm);
                        DeleteObject(hbm);
                        wicBitmap.Release();
                    }
                }else if(IsClipboardFormatAvailable(49289)) { //49289 is PNG on my computer (usually though when you copy an image it has a version of it for CF_BITMAP)
                    //lets see...
                    print("paste png :eyes:");
                }
            }else {
                print(`OpenClipboard failded for some reason (maybe because a window (${c=GetClipboardOwner()} - ${GetWindowText(c) }) already had it open)`, g=GetLastError(), _com_error(g));
            }

            CloseClipboard();

            ReleaseDC(hwnd, dc);
        }else if(wp == "C".charCodeAt(0) && GetKey(VK_CONTROL)) {
            //copy dc
            let success = OpenClipboard(hwnd);
            if(success) {
                print("copying text...");
                print(EmptyClipboard());
                //open clipboard.js to see all these values!
                SetClipboardData(CF_TEXT, "Ctrl+C on pastestuff.js~! (CF_TEXT)");

                //wait what the unicode and oem are generated automatically? (if you comment these out they still show up on EnumClipboardFormats)
                SetClipboardData(CF_UNICODETEXT, "Ctrl+C on pastestuff.js~! (CF_UNICODETEXT)");
                SetClipboardData(CF_OEMTEXT, "Ctrl+C on pastestuff.js~! (CF_OEMTEXT)");
                
                let dc = GetDC(hwnd);

                const hbm = CreateBitmap(w, h, 32, NULL);
                const memDC = CreateCompatibleDC(dc);
                SelectObject(memDC, hbm);
                //wait no don't use printwindow lmao why did it clear the screen?
                //PrintWindow(hwnd, memDC, NULL); //lol (you could just BitBlt instead of printwindow but PrintWindow does something funny with the non client area that i like)

                BitBlt(memDC, 0, 0, w, h, dc, 0, 0, SRCCOPY); //instead of PrintWindow
                DeleteDC(memDC);
                ReleaseDC(hwnd, dc);

                SetClipboardData(CF_BITMAP, hbm); //i think?

                DeleteObject(hbm);

                print(CloseClipboard());
            }else {
                print(`OpenClipboard failded for some reason (maybe because a window (${c=GetClipboardOwner()} - ${GetWindowText(c) }) already had it open)`, g=GetLastError(), _com_error(g));
            }
        }
    }
    //else if(msg == WM_PASTE) { //WM_PASTE only fires when you paste into a combo box control bruh
    //    print("paste?");
    //}
    else if(msg == WM_SIZE) {
        w = LOWORD(lp);
        h = HIWORD(lp);
    }
    else if(msg == WM_DESTROY) {
        wic.Release();
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("pastestuff.js", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "paste stuff onto the canvas (control+c to copy text+bitmap to clipboard)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);