const w = 512;
const h = 512;

const imaginebmp = LoadImage(NULL, __dirname+"/imagine.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE);
const trollbmp = LoadImage(NULL, __dirname+"/troll.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE | LR_MONOCHROME);

print(imaginebmp);

//CreateIconIndirect()
//oh i was about to do this myself but i realized i already found something that did this for me
const imagineico = HICONFromHBITMAP(imaginebmp);
const trollico = HICONFromHBITMAP(trollbmp);

DeleteObject(imaginebmp);
DeleteObject(trollbmp);

const imagineID = 21;
const trollID = 22;
const callbackCommand = 421;
const MANGOID = 50;
const PHONKID = 51;

const popup = CreatePopupMenu();

let notifydata, notifydata2;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        InsertMenu(popup, 0, MF_BYPOSITION | MF_STRING, MANGOID, "MANGO");
        InsertMenu(popup, 1, MF_BYPOSITION | MF_STRING, PHONKID, "PHONK 🗿🍷");

                                //uID is the WPARAM value of callbackCommand                                                                    seems like most of these are unused
        notifydata = new NOTIFYICONDATA(hwnd, imagineID, NIF_ICON | NIF_MESSAGE | NIF_TIP, callbackCommand, imagineico, "standard tooltip max 128", NULL, NULL, "balloon notification max 2546", NULL, "title balloon notification 64", NIIF_USER, NULL, NULL);
        //https://www.codeproject.com/Articles/4768/Basic-use-of-Shell-NotifyIcon-in-Win32
        //https://www.codeproject.com/KB/winsdk/Sigma.aspx
        print(Shell_NotifyIcon(NIM_ADD, notifydata), "shelly"); //lowkey idk what exactly this is gonna do (ohhh it added it to the system tray)
        
                                                    //i can't get NIF_INFO to work lol idk what im doing
        notifydata2 = new NOTIFYICONDATA(hwnd, trollID, NIF_ICON | NIF_MESSAGE | NIF_TIP /*NIF_INFO*/, callbackCommand, trollico, "classic tooltip using NIF_INFO LOL!", NULL, NULL, "balloon notification max 256", NULL, "szInfoTitle", NIIF_USER, NULL, NULL);
        print(r=Shell_NotifyIcon(NIM_ADD, notifydata2), "shelly", r==0 ? (g=GetLastError()) : (g=0),_com_error(g)); //lowkey idk what exactly this is gonna do (ohhh it added it to the system tray)
        
        print(Shell_NotifyIconGetRect(new NOTIFYICONIDENTIFIER(hwnd, imagineID)), "nintendo");
        print(Shell_NotifyIconGetRect(new NOTIFYICONIDENTIFIER(hwnd, trollID)), "nintendo 2");
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
        PostQuitMessage(0);
    }
    //print(msg);
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
//wc.hIcon = imagineico;

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "shell notify (check the tray!)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);