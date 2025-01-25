eval(require("fs").read(__dirname+"/../dllstuffs/marshallib.js")); //damn this marshalling go HARD

//rebar control example (https://nexus-6.uk/code/codeAPIrebarcontrol.html)
//this shit is not working bruh
//https://nexus-6.uk/joomla/index.php/common-controls-menu-item
const ID_REBAR = 1000
const ID_BUTTON = 2000
const ID_EDIT = 2001


class RECT extends memoobjectidk {
    //oh shoot these types have to be in the right order
    static types = {left: "LONG", top: "LONG", right: "LONG", bottom: "LONG"}; //strings because i want to know if they are unsigned (when the first letter is U (i can't be bothered to make each key in sizeof an object))
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

/*
    UINT        cbSize;
    UINT        fMask;
    HIMAGELIST  himl; //basically a handle
*/
class REBARINFO extends memoobjectidk {
    static types = {cbSize: "UINT", fMask: "UINT", himl: "HANDLE"};
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

/*
    UINT        cbSize;
    UINT        fMask;
    UINT        fStyle;
    COLORREF    clrFore;
    COLORREF    clrBack;
    LPWSTR      lpText;
    UINT        cch;
    int         iImage;
    HWND        hwndChild;
    UINT        cxMinChild;
    UINT        cyMinChild;
    UINT        cx;
    HBITMAP     hbmBack;
    UINT        wID;
    UINT        cyChild;
    UINT        cyMaxChild;
    UINT        cyIntegral;
    UINT        cxIdeal;
    LPARAM      lParam;
    UINT        cxHeader;
    #if (NTDDI_VERSION >= NTDDI_VISTA)
    RECT        rcChevronLocation;    // the rect is in client co-ord wrt hwndChild
    UINT        uChevronState; // STATE_SYSTEM_*
*/

//    /([A-Za-z]+)[ ]+([A-Za-z0-9]+);/g
//    {$2: "$1"}, 
class REBARBANDINFO extends memoobjectidk {
    static types = {
        "cbSize": "UINT",
        "fMask": "UINT",
        "fStyle": "UINT",
        "clrFore": "COLORREF",
        "clrBack": "COLORREF",
        "padding": "INT", //PADDING
        "lpText": "HANDLE",
        "cch": "UINT",
        "iImage": "INT",
        "hwndChild": "HWND",
        "cxMinChild": "UINT",
        "cyMinChild": "UINT",
        "cx": "UINT",
        "padding2": "INT", //PADDING 2
        "hbmBack": "HANDLE",
        "wID": "UINT",
        "cyChild": "UINT",
        "cyMaxChild": "UINT",
        "cyIntegral": "UINT",
        "cxIdeal": "UINT",
        "padding3": "INT", //PADDING 3
        "lParam": "LONG_PTR",
        "cxHeader": "UINT",
        "rcChevronLocation": RECT,
        //"left": "LONG",
        //"top": "LONG",
        //"right": "LONG",
        //"bottom": "LONG",
        "uChevronState": "UINT"
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

function CreateRebar(hwndParent)
{
    let hwndRebar = NULL;
    let lResult;
    hwndRebar = CreateWindow(WS_EX_TOOLWINDOW, REBARCLASSNAME,
    NULL,
    WS_VISIBLE | WS_BORDER | WS_CHILD | WS_CLIPCHILDREN |
    WS_CLIPSIBLINGS | RBS_VARHEIGHT | RBS_BANDBORDERS |
    CCS_NODIVIDER | CCS_NOPARENTALIGN |
    0, 0, 0, 200, 100,
    hwndParent, ID_REBAR, hInstance);
    if(hwndRebar){
        /*REBARINFO*/let rbi = new REBARINFO(new Uint8Array(REBARINFO.sizeof()));
        /*HIMAGELIST*/let himlRebar;
        /*HICON*/let hIcon;
        /*REBARBANDINFO*/let rbbi = new REBARBANDINFO(new Uint8Array(REBARBANDINFO.sizeof()));
        /*HWND*/let hwndChild;
        /*RECT*/let rc;
        //set up the ReBar
        himlRebar = ImageList_Create(32, 32, ILC_COLORDDB | ILC_MASK, 1, 0);
        hIcon = LoadIcon(hInstance, "IDI_ICON1"); //MAKEINTRESOURCE(101));
        ImageList_AddIcon(himlRebar, hIcon);
        print(REBARINFO.sizeof(), 16);
        rbi.cbSize = 16;//REBARINFO.sizeof(); //haha
        rbi.fMask = RBIM_IMAGELIST;
        rbi.himl = himlRebar;
        print(PointerFromArrayBuffer(rbi.data), "ptr");
        lResult = SendMessage(hwndRebar, RB_SETBARINFO, 0, PointerFromArrayBuffer(rbi.data));
        //add a band that contains a textbox
        hwndChild=CreateWindow(NULL, "edit", NULL,WS_CHILD | WS_VISIBLE | WS_BORDER,20, 60, 100, 30, hwndRebar, ID_EDIT, hInstance);//edit control
        rc = GetWindowRect(hwndChild);
        //ZeroMemory(&rbbi, sizeof(rbbi));
        print(REBARBANDINFO.sizeof(), 128);
        rbbi.cbSize = 128; //REBARBANDINFO.sizeof();
        rbbi.fMask = RBBIM_SIZE | RBBIM_CHILD | RBBIM_CHILDSIZE |
        RBBIM_ID | RBBIM_STYLE | RBBIM_TEXT |
        RBBIM_BACKGROUND | RBBIM_IMAGE |0;
        rbbi.cxMinChild = rc.right - rc.left;
        rbbi.cyMinChild = rc.bottom - rc.top;
        rbbi.cx = 100;
        rbbi.fStyle = RBBS_CHILDEDGE | RBBS_FIXEDBMP |
        RBBS_GRIPPERALWAYS | 0;
        rbbi.wID = ID_EDIT;
        rbbi.hwndChild = hwndChild;
        //rbbi.lpText = new WString("TextBox").ptr;
        const wstr1 = new WString("TextBox");
        rbbi.lpText = wstr1.ptr;
        rbbi.cch = 2;
        rbbi.hbmBack = LoadImage(NULL, __dirname+"/../minesweeper/ifoundamongus.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE); //LoadBitmap(hInstance, MAKEINTRESOURCE( 102));
        rbbi.iImage = 0;
        print(rbbi.hbmBack, PointerFromArrayBuffer(rbbi.data));
        lResult = SendMessage(hwndRebar, RB_INSERTBAND, -1, PointerFromArrayBuffer(rbbi.data));
        //add a band that contains a button
        hwndChild = CreateWindow(NULL, "button", "Button",
        WS_CHILD | BS_PUSHBUTTON | 0,
        0, 0, 100, 50,
        hwndRebar, ID_BUTTON, hInstance);
        rc = GetWindowRect(hwndChild);
        //rbbi = new REBARBANDINFO(new Uint8Array(REBARBANDINFO.sizeof()));
        rbbi.data = new Uint8Array(REBARBANDINFO.sizeof());
        //ZeroMemory(&rbbi, sizeof(rbbi));
        rbbi.cbSize = REBARBANDINFO.sizeof();
        rbbi.fMask = RBBIM_SIZE | RBBIM_CHILD | RBBIM_CHILDSIZE |
        RBBIM_ID | RBBIM_STYLE | RBBIM_TEXT | RBBIM_BACKGROUND | 0;
        rbbi.cxMinChild = rc.right - rc.left;
        rbbi.cyMinChild = rc.bottom - rc.top;
        rbbi.cx = 100;
        rbbi.fStyle = RBBS_CHILDEDGE | RBBS_FIXEDBMP | RBBS_GRIPPERALWAYS | 0;
        rbbi.wID = ID_BUTTON;
        rbbi.hwndChild = hwndChild;
        //rbbi.lpText = new WString("Button").ptr;
        const wstr2 = new WString("Button");
        rbbi.lpText = wstr2.ptr;

        rbbi.hbmBack = LoadImage(NULL, __dirname+"/../troll.bmp", IMAGE_BITMAP, 0, 0, LR_MONOCHROME | LR_LOADFROMFILE); //LoadBitmap(hInstance, MAKEINTRESOURCE( 102));
        print(rbbi.hbmBack);
        lResult = SendMessage(hwndRebar, RB_INSERTBAND, -1, PointerFromArrayBuffer(rbbi.data));
    }
    MoveRebar(hwndParent);
    return hwndRebar;
}

function MoveRebar(hWnd)
{
    /*RECT*/let rc, rcRebar;
    /*int*/let x, y, cx, cy;
    rc = GetClientRect(hWnd);
    rcRebar = GetWindowRect(GetDlgItem(hWnd, ID_REBAR));
    x = 0;
    y = 0;
    cx = rc.right - rc.left;
    cy = rc.bottom - rc.top;

    //MoveWindow(GetDlgItem(hWnd, ID_REBAR), x, y, cx, cy, TRUE);
    SetWindowPos(GetDlgItem(hWnd, ID_REBAR), NULL, x, y, cx, cy, SWP_NOZORDER);
}

function WndProc(hWnd, uMessage, wParam, lParam)
{
    switch (uMessage){
        case WM_CREATE:
            CreateRebar(hWnd);
            break;
        case WM_DESTROY:
            PostQuitMessage(0);
            break;
        default:
            break;
    }
    //return DefWindowProc(hWnd, uMessage, wParam, lParam);
}

InitCommonControlsEx(ICC_COOL_CLASSES);

const wc = CreateWindowClass("winclass", WndProc);
wc.style = 0;
wc.cbClsExtra = 0;
wc.cbWndExtra = 0;
wc.hInstance = hInstance;
wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
wc.hbrBackground = (COLOR_WINDOW+1);
//wc.lpszMenuName = MAKEINTRESOURCE(104);

CreateWindow(WS_EX_CLIENTEDGE,wc,"Rebar Demo", WS_VISIBLE | WS_OVERLAPPEDWINDOW,CW_USEDEFAULT, CW_USEDEFAULT, 500,200, NULL, NULL, hInstance);
