//taskslikeifoundamongus.js' big brother

const fs = require("fs");

let window, dc, compat, font, fheight;

let x = 0;
let y = 0;
let w = 512;
let h = 200;
//const w = 512;
//const h = 200;

function incTextOut() {
    let i = 0;
    return function(memDC, str) {
        TextOut(memDC, 0, i*fheight, str); i++;
    }
}


//const TextOutI = incTextOut();

function readanddrawmyshit(hwnd) {
    const TextOut = incTextOut();
    const memDC = CreateCompatibleDC(dc);

    const contents = fs.read(__dirname+"/challenges.txt").split("\n"); //hell yeah i just solved the utf8 (emoji) problem (lowkey like a few weeks ago i started reading the js file as a wstring it wouldn't encode emojis correctly and would display like 4 random characters for each emoji)                 unrelated but kinda related -> https://stackoverflow.com/questions/75575229/how-to-store-emojis-in-char8-t-and-print-them-out-in-c20
    
    try { //json.parse and eval might get angry
        const {nx, ny, nw, nh, b} = JSON.parse(contents[0]); //eval(contents[0]); //oops i was trying to eval this (which for some reason didn't work) and discovered that i should be using JSON.parse!

        SetWindowLongPtr(hwnd, GWL_STYLE, WS_VISIBLE | WS_POPUP | (b ? WS_BORDER : NULL));

        //if(nx != x || ny != y || nw != w || nh != h) {
            x = nx;
            y = ny;
            w = nw;
            h = nh;
            SetWindowPos(hwnd, NULL, nx, ny, nw, nh, SWP_NOREDRAW | SWP_NOZORDER);
            DeleteObject(compat);
            compat = CreateCompatibleBitmap(dc, w, h);
        //}

        SelectObject(memDC, compat);
        //SelectObject(memDC, GetDefaultFont());
        FillRect(memDC, 0, 0, w, h, COLOR_BACKGROUND);

        if(font) {
            DeleteObject(font);
        }


        font = eval(contents[1]);
        fheight = GetObjectHFONT(font).lfHeight;
        contents.splice(0, 1); //just snip that out there
        contents.splice(0, 1); //just snip that out there
        contents.splice(0, 1); //remove that newline too

        //Object.entries(arr).filter(([i, e]) => e.startsWith("//")).sort(([i, e], [i2, e2]) => i2 - i); //lol my first way of doing this was kinda extra
        Object.keys(contents).filter((v) => contents[v].startsWith("//")).sort((a, b) => b-a).forEach(index => { //im filtering the keys of contents based on if the value starts with //, then i sort it so that when i splice it doesn't mess up the order i can still use the indicies
            contents.splice(index, 1);
        });

        SelectObject(memDC, font);

        for(const line of contents) {
            const postprocess = eval(`\`${line}\``);
            print(line != postprocess ? postprocess : line);
            TextOut(memDC, postprocess);
        }

    }catch(e) {
        let console = GetStdHandle(STD_OUTPUT_HANDLE);
        SetConsoleTextAttribute(console, 4);
        printNoHighlight(e,"\x07");
        SetConsoleTextAttribute(console, 7);
    }

    DeleteDC(memDC);

    print("redraw m bokrdvvrrs");

    RedrawWindow(hwnd, 0, 0, w, h, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
}

function waitforfuturechangesnigga(hwnd) {
    const handle = FindFirstChangeNotification(__dirname+"/", 0, FILE_NOTIFY_CHANGE_LAST_WRITE);
    while(true) {
        const res = WaitForSingleObject(handle, 0xFFFFFFFF, true); //https://stackoverflow.com/questions/6033074/is-it-possible-to-kill-waitforsingleobjecthandle-infinite
        Sleep(250); //oops i was trying to read challenges.txt right after i saved it and apparently i was doing it too fast
        print(handle, res);
        readanddrawmyshit(hwnd);
        FindNextChangeNotification(handle);
    }
    print("frengind");
    FindCloseChangeNotification(handle);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        window = hwnd;
        //print(COLOR_BACKGROUND, GetSysColor(COLOR_BACKGROUND), RGB(200, 200, 200))
        SetLayeredWindowAttributes(hwnd, RGB(200, 200, 200), 200, LWA_COLORKEY | LWA_ALPHA);
        //DwmExtendFrameIntoClientArea(hwnd, -1, -1, -1, -1);

                                //this fonts real name is Pixel Arial 11
        print(AddFontResourceEx(__dirname+"/../minesweeper/deez.TTF", FR_PRIVATE), "added fonts"); //using FR_PRIVATE means that only this app has access to this font (for some reason the regular AddFontResource would add the font for every process) https://learn.microsoft.com/en-us/answers/questions/1282086/how-to-use-other-fonts-in-gdi
        dc = GetDC(hwnd);
        compat = CreateCompatibleBitmap(dc, w, h);
        //const memDC = CreateCompatibleDC(dc);
        //SelectObject(memDC, compat);
        ////SelectObject(memDC, GetDefaultFont());
        //FillRect(memDC, 0, 0, w, h, COLOR_BACKGROUND);
        //DeleteDC(memDC);
        readanddrawmyshit(hwnd);
        //FindFirstChangeNotification("")
        //TextOut(memDC, "Investigate the redline rig nigga for evidence");
        //TextOut(memDC, "land at doomstatd");
        //TextOut(memDC, "damage opponents while airborne");
        //TextOut(memDC, "get a monmarch pistol");
        //TextOut(memDC, "sprint distance after taking damage");
        //TextOut(memDC, "gain health by hurting yourself");
        ////TextOut(memDC, "kill with a headshost");
        //TextOut(memDC, "drive to 3 different locations");
        //TextOut(memDC, "hit up freaky fields and the underworld");
        //TextOut(memDC, "accept a shadow breifing armorotug NIGGAS");
        //DeleteDC(memDC);
        SetTimer(hwnd, 1, 0);
    }else if(msg == WM_TIMER) {
        KillTimer(hwnd, 1);
        waitforfuturechangesnigga(hwnd);
    }
    else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, compat);
        BitBlt(ps.hdc, 0, 0, w, h, memDC, 0, 0, SRCCOPY);
        DeleteDC(memDC);
        EndPaint(hwnd, ps);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        DeleteObject(font);
        DeleteObject(compat);
        print(RemoveFontResourceEx(__dirname+"/../minesweeper/deez.TTF", FR_PRIVATE),"== 1?");
    }
}

const wc = CreateWindowClass("iwannainspiresomsigmastonight", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TRANSPARENT | WS_EX_TOPMOST, wc, "sigma", WS_VISIBLE | WS_POPUP, x, y, w, h, NULL, NULL, hInstance);