const w = 512;
const h = 512;

const imaginebmp = LoadImage(NULL, __dirname+"/imagine.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE);
const trollbmp = LoadImage(NULL, __dirname+"/troll.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE | LR_MONOCHROME);

print(imaginebmp);

//CreateIconIndirect()
//oh i was about to do this myself but i realized i already found something that did this for me
const imagineico = HICONFromHBITMAP(imaginebmp);
const trollico = HICONFromHBITMAP(trollbmp);

//DeleteObject(imaginebmp); //nah don't delete this thang yet we using that later (in WM_TIMER)
DeleteObject(trollbmp);

const imagineID = 21;
const trollID = 22;
const callbackCommand = 421;
const MANGOID = 50;
const PHONKID = 51;

const popup = CreatePopupMenu();

let notifydata, notifydata2;

class GDI {
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

let i = 0;
let lastIco = 0;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        InsertMenu(popup, 0, MF_BYPOSITION | MF_STRING, MANGOID, "MANGO");
        InsertMenu(popup, 1, MF_BYPOSITION | MF_STRING, PHONKID, "PHONK 🗿🍷");

                                //uID is the WPARAM value of callbackCommand                                                                    seems like most of these are unused
        notifydata = new NOTIFYICONDATA(hwnd, imagineID, NIF_ICON | NIF_MESSAGE | NIF_TIP, callbackCommand, trollico, "standard tooltip max 128", NULL, NULL, "balloon notification max 2546", NULL, "title balloon notification 64", NIIF_USER, NULL, NULL);
        //https://www.codeproject.com/Articles/4768/Basic-use-of-Shell-NotifyIcon-in-Win32
        //https://www.codeproject.com/KB/winsdk/Sigma.aspx
        print(Shell_NotifyIcon(NIM_ADD, notifydata), "shelly"); //lowkey idk what exactly this is gonna do (ohhh it added it to the system tray)
        
                                                    //i can't get NIF_INFO to work lol idk what im doing
        notifydata2 = new NOTIFYICONDATA(hwnd, trollID, NIF_ICON | NIF_MESSAGE | NIF_TIP /*NIF_INFO*/, callbackCommand, trollico, "classic tooltip using NIF_INFO LOL!", NULL, NULL, "balloon notification max 256", NULL, "szInfoTitle", NIIF_USER, NULL, NULL);
        print(r=Shell_NotifyIcon(NIM_ADD, notifydata2), "shelly", r==0 ? (g=GetLastError()) : (g=0),_com_error(g)); //lowkey idk what exactly this is gonna do (ohhh it added it to the system tray)
        
        print(Shell_NotifyIconGetRect(new NOTIFYICONIDENTIFIER(hwnd, imagineID)), "nintendo");
        print(Shell_NotifyIconGetRect(new NOTIFYICONIDENTIFIER(hwnd, trollID)), "nintendo 2");

        SetTimer(hwnd, NULL, 16);
    }else if(msg == WM_TIMER) {
        //update the troll face ico for the lols
        print(i);
        //const screen = GetDC(NULL);
        const dc = GetDC(hwnd);
        const bmp = CreateCompatibleBitmap(dc, 528, 566);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bmp);
        const memDC2 = CreateCompatibleDC(dc);
        SelectObject(memDC2, imaginebmp);
        SetGraphicsMode(memDC, GM_ADVANCED);
        SetWorldTransform(memDC, GDI.Matrix3x2FToXFORM(Matrix3x2F.Rotation(i, 528/2, 566/2)));
        BitBlt(memDC, 0, 0, 528, 566, memDC2, 0, 0, SRCCOPY);
        SetWorldTransform(memDC, GDI.Matrix3x2FToXFORM(Matrix3x2F.Identity())); //i had to reset the transform if i wanted to draw it on dc
        DeleteDC(memDC2);

        //SetGraphicsMode(dc, GM_ADVANCED);
        BitBlt(dc, ((i*5)%(h*2))-h, 0, 528, 566, memDC, 0, 0, SRCCOPY); //idk why the transformation doesn't carry over here (wait it only draws it once? (no it only draws it when it's right-side up lol what...))
        
        //const hbitmap = CopyImage(bmp, IMAGE_BITMAP, 528, 566, LR_COPYDELETEORG); //haha delete originsl
        if(lastIco) {
            DeleteObject(lastIco);
        }
        const nico = HICONFromHBITMAP(bmp); //oh wait i didn't need to make a copy! i was rotating the dc instead of storing it in the bitmap!
        lastIco = nico;
        //SelectObject(memDC, nico);
        //BitBlt(dc, 0, 0, 528, 566, memDC, 0, 0, SRCCOPY);
        //Shell_NotifyIcon(NIM_MODIFY, new NOTIFYICONDATA(hwnd, imagineID, NIF_ICON, NULL, nico, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, nico));
        Shell_NotifyIcon(NIM_MODIFY, new NOTIFYICONDATA(hwnd, imagineID, NIF_ICON, NULL, nico, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL));
        

        DeleteObject(bmp);
        //const memDC2 = CreateCompatibleDC(dc);
        //SelectObject(memDC2, imaginebmp);

        //BitBlt(memDC, 0, 0, 528, 566, memDC2, 0, 0, SRCCOPY);
        //DeleteDC(memDC2);
        //BitBlt(screen, 0, 0, 528, 566, memDC, 0, 0, SRCCOPY);
        DeleteDC(memDC);
        ReleaseDC(hwnd, dc);
        //ReleaseDC(NULL, screen);
        i++;
    }else if(msg == callbackCommand) {
        print(wp, lp); //wp is uID (21)    lp is the message
        if(wp == imagineID) {
            if(lp == WM_LBUTTONDOWN) {
                Msgbox("you just clicked on my funny tray icon", "shellnotify.js", MB_OK | MB_ICONINFORMATION);
            }else if(lp == WM_RBUTTONDOWN || lp == WM_CONTEXTMENU) {
                const mouse = GetCursorPos();
                SetForegroundWindow(hwnd);
                TrackPopupMenu(popup, TPM_LEFTALIGN | TPM_BOTTOMALIGN, mouse.x, mouse.y, hwnd);
            }
        }else if(wp == trollID) {
            if(lp == WM_LBUTTONDOWN) {
                Msgbox("low quality troll face", "shellnotify.js", MB_CANCELTRYCONTINUE | MB_ICONERROR); //lol
            }
        }
    }else if(msg == WM_COMMAND) {
        if(wp == MANGOID) {
            print("MANGO option clicked");
        }else if(wp == PHONKID) {
            print("PHONK option clicked");
        }
    }
    else if(msg == WM_DESTROY) {
        print(Shell_NotifyIcon(NIM_DELETE, notifydata), "cleanup shelly"); //cleanup
        print(Shell_NotifyIcon(NIM_DELETE, notifydata2), "cleanup shelly2"); //cleanup
        DeleteObject(imaginebmp); //clerannup
        PostQuitMessage(0);
    }
    //print(msg);
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
//wc.hIcon = imagineico;

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "shell notify (check the tray!)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);