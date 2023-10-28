//https://twitter.com/cuzsie/status/1708226732950749316
//Msgbox("yo watch out this is finna shutdown your computer LOL", "Peter Alert", MB_OKCANCEL);
const peter = LoadImage(NULL, __dirname+"/peter.bmp", IMAGE_BITMAP, 0, 0, LR_SHARED | LR_LOADFROMFILE | LR_CREATEDIBSECTION);

//aw DAMN i was trying to figure out why MaskBlt wasn't working and the bitmap has to be monochromic and i thought it was because i exported it as such from paint.net but there is actually a FLAG for that and i just checked
const mask = LoadImage(NULL, __dirname+"/petermask.bmp", IMAGE_BITMAP, 0, 0, LR_SHARED | LR_LOADFROMFILE | LR_MONOCHROME); //had to export from paint.net as bmp with a bit-depth of 1 (also i used the curves effect to make peter white just incase i need to remember that)
print(peter, _com_error(GetLastError()), __dirname+"/peter.bmp"); //aw damn it wasn't working because the bitmap was transparent (oh shoot that's why the trollface isn't working also damn)
//const lolFont = CreateFontSimple("Impact", 20, 40);
const peterTiled = CreatePatternBrush(peter);

const width = 540;
const height = 360;

let button;

function init(hwnd) {
    button = CreateWindow(NULL, "BUTTON", "OK", WS_CHILD | WS_VISIBLE, (width-146)/2, height/2+36, 146, 36, hwnd, NULL, hInstance); //bruh at school i realized i was updating the screen before making the button causing it to show up late
    InvalidateRect(hwnd, 0, 0, width, height, true);
    UpdateWindow(hwnd); //draw immediately
    PlaySoundSpecial(__dirname+"/peterstartup.mp3", "startup");
    //print(GetObjectHBITMAP(peter));
    //const bits = GetObjectDIBITMAP(peter).dsBm.bmBits;
    //print(bits);
    //let dc = GetDC(hwnd);
    //const memDC = CreateCompatibleDC(dc);
    //SelectObject(memDC, mask);
    //SelectObject(memDC, GetStockObject(DC_BRUSH));
    ////SetDCBrushColor(memDC, RGB(255,255,255));
    //FillRect(memDC, 0, 0, 146/2, 146/2, NULL); //hbrush is null because im using DC_BRUSH LO! (lazy)
    //DeleteDC(memDC);
    //ReleaseDC(hwnd, dc);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        init(hwnd);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        //const lastFont = SelectObject(ps.hdc, lolFont);
        //TextOut(ps.hdc, 0, 0, "digga");
        //DrawText(ps.hdc, "and i forgot the text the whole time", width/2, 0, width, height, DT_CENTER);
        //SelectObject(ps.hdc, lastFont);
        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, peter);
        //BitBlt(ps.hdc, (width-146)/2, height/2-146, 146, 146, memDC, 0, 0, SRCCOPY);
        print(MaskBlt(ps.hdc, (width-146)/2, height/2-146, 146, 146, memDC,0,0,mask, 0, 0, MAKEROP4(SRCCOPY, 0x00AA0029)), _com_error(GetLastError())); //forgot to add MAKEROP4 as a function and v8 didn't say SHIT he just smiled and waved (yo my power just turned off for a SPLIT second and my computer is still on lets go) (haha i forgot to build it)
        DeleteDC(memDC);
        EndPaint(hwnd, ps);
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }else if(wp == VK_RETURN) {
            //SendMessage(hwnd, WM_) //sendmessage for some reason can't change the background of the window (but can basically change everything else)
            SetClassLongPtr(hwnd, GCLP_HBRBACKGROUND, peterTiled); //LO!
            InvalidateRect(hwnd, 0, 0, width, height, true); //gotta redraw
            UpdateWindow(hwnd);
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }else if(msg == WM_COMMAND) {
        if(lp == button && wp == BN_CLICKED) { //haven't added the https://learn.microsoft.com/en-us/windows/win32/controls/button-messages#notification-messages-from-buttons event names yet so imagine i put && BN_CLICKED (ok nevermind i added them)
            //print("BUTTON EVENT!");
            //Msgbox("playsound peter griffin", "heehehehe", MB_OK);
            SetClassLongPtr(hwnd, GCLP_HBRBACKGROUND, peterTiled); //LO!
            InvalidateRect(hwnd, 0, 0, width, height, true); //gotta redraw
            UpdateWindow(hwnd);
            //PlaySound peter griffin hehe
            //PlaySound("E:/Program Files/Image-Line/FL Studio 20/heartbeat shift.wav", NULL, SND_FILENAME);
            //PlaySoundSpecial("E:/Downloads/update2022-castle-funk.mp3", "funk", hwnd, true);
            //PlaySoundSpecial("D:/21st century meme pack/clip funnies/aeiou.mp3", "funk", hwnd);
            PlaySoundSpecial(__dirname+"/peter.mp3", "peteg", hwnd);
            if(Msgbox("shutdown computer", "heehehehe", MB_OKCANCEL) == IDOK) {
                if(Msgbox("ARE YOU SURE?", "heehehehe", MB_OKCANCEL | MB_ICONQUESTION) == IDOK) {
                    Msgbox("alrighty then", "heehehehe", MB_OK | MB_ICONERROR);
                    //i thought you had to pass NULL for the local machine but testing it at school revealed that i have to use "localhost"
                    InitiateSystemShutdown("localhost", "Peter Alert hehehehe", 5, false, false, 0x00000003); //https://learn.microsoft.com/en-us/windows/win32/shutdown/system-shutdown-reason-codes
                }
            }
            DestroyWindow(hwnd);
            //Beep(500, 200);
            //Sleep(750);
            //Beep(500, 200);
            //Sleep(750);
            //Beep(500, 200);
        }
        //print(wp, lp, button);
    }else if(msg == MM_MCINOTIFY) { //yeah idk it ain't getting called (wait nevermind it worked)
        print(wp, lp, "done playing sound lol");
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all
winclass.hIcon = winclass.hIconSm = HICONFromHBITMAP(peter); //LO! (paint.net does not export .ico BUT i can do .bmp so (i think you are supposed to DeleteObject() because HICONFromHBITMAP uses IconFromIndirect so...))
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);
                                                                                                //math
CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "Peter Alert", WS_CAPTION | WS_SYSMENU | WS_VISIBLE, screenWidth/2-width/2, screenHeight/2-height/2, width, height, NULL, NULL, hInstance); //blocking

StopSoundSpecial("startup"); //just clean up (and if i really cared i'd clean up HICONFromHBITMAP too)
StopSoundSpecial("peteg");