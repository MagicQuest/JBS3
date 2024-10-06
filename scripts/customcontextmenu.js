const ID_SKIBIDI = 0x21B1D1; //these id just need to be unique
const ID_SEX = 0x2E7;
const ID_TROLL = 0b10101; //oh yeah a month ago or something i learned that you could do 0b for binary
const ID_TROLL2 = 0xdeadbeef; //fojmvdsnksekfvofnwskfvyahb
const ID_SPECIAL = 1000; //id for the ownerdraw menu
const ID_SPECIAL2 = 1001; //id for the ownerdraw menu

const trollBmp = LoadImage(NULL, __dirname+"/troll.bmp", IMAGE_BITMAP, 32, 32, LR_LOADFROMFILE | LR_MONOCHROME); //this troll bmp only has 1 bpp (monochrome)

const bruhchecked = LoadImage(NULL, __dirname+"/box.bmp", IMAGE_BITMAP, 16, 16, LR_LOADFROMFILE);
const bruhunchecked = LoadImage(NULL, __dirname+"/boxside.bmp", IMAGE_BITMAP, 16, 16, LR_LOADFROMFILE);

const sans = CreateFontSimple("comic sans ms", 6, 24);

let troll2check = false;

const w = 512;
const h = 512;

let hPopupMenu;

function GetMenuItemInfoString(hMenu, position, fByPosition) { //wait this hasn't been working 100% correctly this whole time (i might've done GetMenuItemInfo wrong?) yeah i think this is the source of my heap corruption errors so what have i done wrong 🧐 (OK I FIXED IT i just didn't understand how the process worked (im suprised it still worked some of the time though))
    //ok so the first time you call GetMenuItemInfo with MIIM_STRING it returns nothing but the cch which is how many characters are in the string
    //then you have to GetMenuItemInfo again with the new cch and it will actually give you the string
    const info = {fMask: MIIM_STRING}; //by specifying fMask as MIIM_STRING we are retrieving the string
    info.cch = GetMenuItemInfo(hMenu, position, fByPosition, info).cch+1; //cch+1 is the length of the string to retrieve

    return GetMenuItemInfo(hMenu, position, fByPosition, info).dwTypeData; //now that info has the length of the string it can send the actual string through dwTypeData
}

const crSelText = GetSysColor(COLOR_HIGHLIGHTTEXT); 
const crSelBkgnd = RGB(255, 127, 127); //GetSysColor(COLOR_HIGHLIGHT); 

//for MF_OWNERDRAW menus
const menuData = {};
menuData[ID_SPECIAL] = {text: "erm... what the sigma! 🤓🤓🤓🤓", checked: false};
menuData[ID_SPECIAL2] = {text: "WHAT? HELP ME!", checked: false};

print(GetObjectHFONT(GetDefaultFont()));

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        hPopupMenu = CreatePopupMenu();
        InsertMenu(hPopupMenu, 0, MF_BYPOSITION | MF_BITMAP, ID_TROLL, trollBmp); //when using MF_BITMAP you gotta pass a bitmap (obvisoulsylg) //(wait why is it so big i thought it would shrink it (oh i gotta use InsertMenuItem)) //lmao the big ass troll face was fucking my shit up
        InsertMenu(hPopupMenu, 0, MF_BYPOSITION | MF_STRING, ID_SEX, "SEX?");
        InsertMenu(hPopupMenu, 0, MF_BYPOSITION | MF_STRING, ID_SKIBIDI, "skibidi");

        let iteminfo = {fMask: MIIM_ID | MIIM_CHECKMARKS | MIIM_STRING, wID: ID_TROLL2, hbmpChecked: bruhchecked, hbmpUnchecked: bruhunchecked, dwTypeData: "troll mode max:", cch: 15} //https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-menuiteminfow
        print(InsertMenuItem(hPopupMenu, 0, true, iteminfo));

        //print(GetMenuItemInfo(hPopupMenu, ID_TROLL2, false, {fMask: MIIM_STRING})); //by specifying fByPosition as false, the position parameter targets the menu item with the id that you supply through position 
        print(GetMenuItemInfoString(hPopupMenu, ID_TROLL2, false)); //by specifying fByPosition as false, the position parameter targets the menu item with the id that you supply through position 

        iteminfo = {fMask: MIIM_STRING | MIIM_BITMAP, dwTypeData: "oh shit this icecream is fucking freezing my teeth HEPL", hbmpItem: HBMMENU_POPUP_CLOSE} //https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-menuiteminfow
        print(InsertMenuItem(hPopupMenu, 0, true, iteminfo));

        InsertMenu(hPopupMenu, 100, MF_BYPOSITION | MF_OWNERDRAW, ID_SPECIAL, 2093); //i wonder what's for dinner (for MF_OWNERDRAW the last parameter is passed through the lparam->itemData member of WM_MEASUREITEM and WM_DRAWITEM)
        
        InsertMenu(hPopupMenu, 100, MF_BYPOSITION | MF_OWNERDRAW, ID_SPECIAL2, 0x420);

    }else if(msg == WM_CONTEXTMENU) {
        print(lp, wp, GET_X_LPARAM(lp), GET_Y_LPARAM(lp));
        TrackPopupMenu(hPopupMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, GET_X_LPARAM(lp), GET_Y_LPARAM(lp), hwnd); //the actual TrackPopupMenu has a reserved parameter so in jbs i ain't including that
        
        //const rect = GetWindowRect(GetConsoleWindow());//{left: 0, top : 0, right: 500, bottom: 500};
        //TrackPopupMenuEx(hPopupMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, GET_X_LPARAM(lp), GET_Y_LPARAM(lp), hwnd, rect); //when specifying rect, the popup menu will not intersect the area
    }else if(msg == WM_COMMAND) {
        //feeling quirky but i lowkey don't really like switch statements (but for some reason they're more efficient so i gotta start liking them)
        switch(wp) {
            case ID_SKIBIDI:
                print("skibidi mode activated");
                break;
            case ID_SEX:
                print("sex yes");
                break;
            case ID_TROLL:
                print("activating troll mode...");
                break;
            case ID_TROLL2:
                troll2check = !troll2check;
                print("troll 2 \nbreak;"); //oh i don't think i've tried putting a newline in a print
                CheckMenuItem(hPopupMenu, ID_TROLL2, MF_BYCOMMAND | (troll2check && MF_CHECKED)); //cheeky js shit here if troll2check is false then it is coerced as 0 and doesn't add anything but if it's true it sends MF_CHECKED (basically just troll2check ? MF_CHECKED : 0)
                break;
            case ID_SPECIAL:
            case ID_SPECIAL2:
                menuData[wp].checked = !menuData[wp].checked;
                print("checked? ", wp, menuData[wp]);
                CheckMenuItem(hPopupMenu, wp, MF_BYCOMMAND | (menuData[wp].checked && MF_CHECKED));
                break;
        }
    }else if(msg == WM_MEASUREITEM) { //for ID_SPECIAL
        //unfortunately WM_MEASUREITEM has it's LPARAM point to a MEASUREITEMSTRUCT but you have to change it by pointing to it like struct->itemWidth = blahblahblah anyways to solve this problem i could make a function like Set("whatever", value) but that would be lame... the real man's solution would be to use the same principle that javascript classes use when you uset the set keyword before a function
        //or i could make a wrapper object in js that writes that shit for me (much easier)
        //i feel like actually trying to do the former would take forever i have no idea how you would do that in v8 land (i still don't know how to MAKE a class yet (which i guess i should figure out))
        //wait a second i think i just found a solution READING THROUGH OLD DOCS! (OH they moved the GOOD docs to another place and i finally found it)
        //well damn i could've sworn on my life that v8 didn't have good docs but i MIGHT have not been looking hard enough (which shoot im suprised)
        const lpmis = GET_MEASURE_ITEM_STRUCT_LPARAM(lp);
        //print(lpmis.itemData, "breathe"); //"if i come around you can i be myself" (NOT DRAKE)
        const dc = GetDC(hwnd);
        const last = SelectObject(dc, sans);
        
        const size = GetTextExtentPoint32(dc, menuData[lpmis.itemID].text); //for menu items, lpmis.itemID is the id you specify with InsertMenu
        //print(size);
        lpmis.itemWidth = size.width; //directly setting these values is literally equal to lpmis->itemWidth
        lpmis.itemHeight = size.height;
        //lpmis.itemData = "yousutpid"; //this should crash v8 (in my professional opinion) ok it actually didn't im throughly suprised it just set itemData to 0 (still, don't be setting these to strings brah)

        //print(lpmis);

        SelectObject(dc, last);
        ReleaseDC(hwnd, dc);
    }else if(msg == WM_DRAWITEM) { //for ID_SPECIAL
        const lpdis = GET_DRAW_ITEM_STRUCT_LPARAM(lp);
        //print(lpdis.itemData, "breathe");

        let fSelected = false;
        let crText, crBkgnd, hfontOld;
        
        if (lpdis.itemState & ODS_SELECTED) 
        {
            crText = SetTextColor(lpdis.hDC, crSelText);
            crBkgnd = SetBkColor(lpdis.hDC, crSelBkgnd);
            fSelected = true; 
        }

        wCheckX = GetSystemMetrics(SM_CXMENUCHECK); 
        nTextX = wCheckX + lpdis.rcItem.left; 
        nTextY = lpdis.rcItem.top;

        //lpdis.rcItem = {left: 0, right: 1000, top: 0, bottom: 1000}; //don't change this lol this wasa a test
        
        hfontOld = SelectObject(lpdis.hDC, sans);

        TextOut(lpdis.hDC, nTextX, nTextY, menuData[lpdis.itemID].text);
        
        if(menuData[lpdis.itemID].checked) {
            //const extents = GetTextExtentPoint32(lpdis.hDC, menuData[lpdis.itemID].text); //why is extents lowkey lying
            
            const memDC = CreateCompatibleDC(lpdis.hDC);
            SelectObject(memDC, trollBmp);
            StretchBlt(lpdis.hDC, /*extents.width*/lpdis.rcItem.right-64, nTextY, 64, 32, memDC, 0, 0, 32, 32, SRCCOPY);
            DeleteDC(memDC);
        }

        SelectObject(lpdis.hDC, hfontOld);


        //hfontOld = SelectObject(lpdis.hDC, gab);
        
        //TextOut(lpdis.hDC, nTextX+(menuData[lpdis.itemID].text.length*6), nTextY-6, "custom drawing sponsored by jbs3"); //random math lol

        //SelectObject(lpdis.hDC, hfontOld);

        if (fSelected) 
        { 
            SetTextColor(lpdis.hDC, crText); 
            SetBkColor(lpdis.hDC, crBkgnd); 
        }
        
        //print(lpdis);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        DestroyMenu(hPopupMenu);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "right click on the window fella", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, w+20, h+43, NULL, NULL, hInstance);