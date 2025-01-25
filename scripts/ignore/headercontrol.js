//header control example https://nexus-6.uk/code/codeAPIheadercontrol.html (damn i can't believe it actually worked)
eval(require("fs").read(__dirname+"/../dllstuffs/marshallib.js")); //damn this marshalling go HARD

class Rect extends memoobjectidk {
                //oh shoot these types have to be in the right order
    static types = {left: "LONG", top: "LONG", right: "LONG", bottom: "LONG"}; //strings because i want to know if they are unsigned (when the first letter is U (i can't be bothered to make each key in sizeof an object))
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

class WINDOWPOS extends memoobjectidk {
    static types = {hwnd: "HWND", hwndInsertAfter: "HWND", x: "INT", y: "INT", cx: "INT", cy: "INT", flags: "UINT"};
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

class HDLAYOUT extends memoobjectidk {
    static types = {prc: "LONG_PTR", pwpos: "LONG_PTR"};
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

/*
    UINT    mask;
    int     cxy;
    LPWSTR  pszText;
    HBITMAP hbm;
    int     cchTextMax;
    int     fmt;
    LPARAM  lParam;
    int     iImage;        // index of bitmap in ImageList
    int     iOrder;
    UINT    type;           // [in] filter type (defined what pvFilter is a pointer to)
    void *  pvFilter;       // [in] fillter data see above
#if (NTDDI_VERSION >= NTDDI_VISTA)
    UINT   state;
#endif
*/
class HDITEM extends memoobjectidk {
    static types = {mask: "UINT", cxy: "INT", pszText: "LONG_PTR", hbm: "HANDLE", cchTextMax: "INT", fmt: "INT", lParam: "LONG_PTR", iImage: "INT", iOrder: "INT", type: "UINT", pvFilter: "HANDLE", state: "UINT"}
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

/*
    NMHDR   hdr; (HWND hwndFrom, UINT_PTR idFrom, UINT code)
    int     iItem;
    int     iButton;
    HDITEMW *pitem;
*/
class NMHEADER extends memoobjectidk { //YO BECAUSE THIS STRUCT USES THE NMHDR STRUCT AS A MEMBER THERE IS A 4 BYTE PADDING BETWEEN hdr AND iItem!!!!!!!!!
    static types = {hwndFrom: "HWND", idFrom: "UINT_PTR", code: "UINT", PADDING: "INT", iItem: "INT", iButton: "INT", pitem: "HANDLE"};
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

let headerCtl;
const ID_HEADER = 100;
function CreateHeader(hwndParent) {
    let hwndHeader;
    let rcParent = new Rect(new Uint8Array(Rect.sizeof()));
    let hdl = new HDLAYOUT(new Uint8Array(HDLAYOUT.sizeof()));
    let wp = new WINDOWPOS(new Uint8Array(WINDOWPOS.sizeof()));
    if ((hwndHeader = CreateWindow(0, WC_HEADER, NULL, WS_CHILD | WS_BORDER | HDS_BUTTONS | HDS_HORZ, 0, 0, 0, 0, hwndParent, ID_HEADER, NULL)) == NULL) {
        return NULL;
    }
    for(const [prop, key] of Object.entries(GetClientRect(hwndParent))) {
        rcParent[prop] = key; //oh wow
    }
    hdl.prc = PointerFromArrayBuffer(rcParent.data);
    hdl.pwpos = PointerFromArrayBuffer(wp.data);
    if (!SendMessage(hwndHeader, HDM_LAYOUT, 0, PointerFromArrayBuffer(hdl.data))) {
        return NULL;
    }
    // Set the size, position, and appearance of the header control.
    SetWindowPos(hwndHeader, wp.hwndInsertAfter, wp.x, wp.y,wp.cx, wp.cy, wp.flags | SWP_SHOWWINDOW);
    let hdi = new HDITEM(new Uint8Array(HDITEM.sizeof()));
    hdi.mask = HDI_TEXT | HDI_FORMAT | HDI_WIDTH;
    const wstr1 = new WString("column 1");
    hdi.pszText = wstr1.ptr; //damn this shit geinous
    print(wstr1, hdi.pszText, "pszText");
    hdi.cxy = 150;
    hdi.cchTextMax = WStringFromPointer(hdi.pszText).length; //lstrlen(hdi.pszText);
    hdi.fmt = HDF_LEFT | HDF_STRING;
    let index;
    index = SendMessage(hwndHeader, HDM_INSERTITEM, 1, PointerFromArrayBuffer(hdi.data));
    hdi.mask = HDI_TEXT | HDI_FORMAT | HDI_WIDTH;
    const wstr2 = new WString("column 2");
    hdi.pszText = wstr2.ptr;
    hdi.cxy = rcParent.right-150;
    hdi.cchTextMax = WStringFromPointer(hdi.pszText).length; //lstrlen(hdi.pszText);
    hdi.fmt = HDF_LEFT | HDF_STRING;
    index = SendMessage(hwndHeader, HDM_INSERTITEM, 2, PointerFromArrayBuffer(hdi.data));
    
    return hwndHeader;    
}
function WndProc(hwnd, msg, wp, lp) {
    let winpos = new WINDOWPOS(new Uint8Array(WINDOWPOS.sizeof()));
    switch(msg)
    {
        case WM_CREATE:
            //load common control class ICC_LISTVIEW_CLASSES from the dynamic-link library (DLL)
            InitCommonControlsEx(ICC_LISTVIEW_CLASSES);
            headerCtl=CreateHeader(hwnd);
            break;
        //respond to windows size change.
        case WM_SIZE:
            let rect = new Rect(new Uint8Array(Rect.sizeof()));
            let hdl = new HDLAYOUT(new Uint8Array(HDLAYOUT.sizeof()));
            let hdi = new HDITEM(new Uint8Array(HDITEM.sizeof()));
            for(const [prop, key] of Object.entries(GetClientRect(hwnd))) {
                rect[prop] = key;
            }
            hdl.prc=PointerFromArrayBuffer(rect.data);
            hdl.pwpos=PointerFromArrayBuffer(winpos.data);
            //Header_Layout(headerCtl,&hdl);//align first header
            SendMessage(headerCtl, HDM_LAYOUT, 0, PointerFromArrayBuffer(hdl.data));
            //MoveWindow(headerCtl,winpos.x,winpos.y,winpos.cx,winpos.cy,1);
            SetWindowPos(headerCtl, NULL, winpos.x, winpos.y, winpos.cx, winpos.cy, SWP_NOZORDER | SWP_SHOWWINDOW);
            hdi.mask = HDI_TEXT | HDI_FORMAT | HDI_WIDTH;
            hdi.pszText = new WString("column 2").ptr;
            hdi.cxy = rect.right;
            hdi.cchTextMax = WStringFromPointer(hdi.pszText).length; //lstrlen(hdi.pszText);
            hdi.fmt = HDF_LEFT | HDF_STRING;
            SendMessage(headerCtl, HDM_SETITEM, 1, PointerFromArrayBuffer(hdi.data));
            //Header_SetItem( headerCtl, 2,&hdi);//align second header
            break;
        
        case WM_NOTIFY:
        //detects change in header control
        {
            //NMHEADER * header_item = (NMHEADER *)lParam;
            //header_item = new NMHEADER(CopyPtrAsUint8Array(lParam, NMHEADER.sizeof())); //i lowkey had to ask chat about what i should call this new function and his answer was just close enough to remind me that i DEFINITELY did something like this before and i was right (i use ArrayBufferFromPointer in my opencv examples)
            header_item = new NMHEADER(ArrayBufferFromPointer(1, 8, lp, NMHEADER.sizeof())); //OOHHHH I KNEW I MADE A FUNCTION LIKE THIS BEFORE!
            //respond to header click and display message boz
            //if ( header_item->hdr.code == HDN_ITEMCLICK ) //im not doing all that bruh 
            print(header_item.code, header_item.iItem);
            if(header_item.code == HDN_ITEMCLICK)
            {
                //switch ( header_item->iItem)
                switch(header_item.iItem)
                {
                case 0:
                    Msgbox("header 1", "header 1 clicked", MB_OK );
                    break;
                case 1:
                    Msgbox("header 2", "header 2 clicked", MB_OK );
                    break;
            
                }
            }
            return 0;
        }
        //break;
        case WM_CLOSE:
            DestroyWindow(hwnd);
            break;
        case WM_DESTROY:
            PostQuitMessage(0);
            break;
        //default:
            //return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    //return 0;    
}

const wc = CreateWindowClass("winclass", WndProc);
wc.style = 0;
wc.lpfnWndProc = WndProc;
wc.cbClsExtra = 0;
wc.cbWndExtra = 0;
wc.hInstance = hInstance;
wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
wc.hbrBackground = (COLOR_WINDOW+1);
wc.lpszMenuName = NULL;
wc.hIconSm = LoadIcon(NULL, IDI_APPLICATION);

window = CreateWindow(WS_EX_CLIENTEDGE, wc, "Header Control", WS_VISIBLE | WS_OVERLAPPEDWINDOW,CW_USEDEFAULT, CW_USEDEFAULT, 400, 120, NULL, NULL, hInstance);