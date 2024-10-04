const ID_SKIBIDI = 0x21B1D1; //these id just need to be unique
const ID_SEX = 0x2E7;
const ID_TROLL = 0b10101; //oh yeah a month ago or something i learned that you could do 0b for binary
const ID_TROLL2 = 0xdeadbeef; //fojmvdsnksekfvofnwskfvyahb

const trollBmp = LoadImage(NULL, __dirname+"/troll.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE | LR_MONOCHROME); //this troll bmp only has 1 bpp (monochrome)

const bruhchecked = LoadImage(NULL, __dirname+"/box.bmp", IMAGE_BITMAP, 16, 16, LR_LOADFROMFILE);
const bruhunchecked = LoadImage(NULL, __dirname+"/boxside.bmp", IMAGE_BITMAP, 16, 16, LR_LOADFROMFILE);

const w = 512;
const h = 512;

let hPopupMenu;

function GetMenuItemInfoString(hMenu, position, fByPosition) {
    //ok so the first time you call GetMenuItemInfo with MIIM_STRING it returns nothing but the cch which is how many characters are in the string
    //then you have to GetMenuItemInfo again with the new cch and it will actually give you the string
    const info = {fMask: MIIM_STRING}; //by specifying fMask as MIIM_STRING we are retrieving the string
    info.cch = GetMenuItemInfo(hMenu, position, fByPosition, info).cch; //cch is the length of the string to retrieve

    return GetMenuItemInfo(hMenu, position, fByPosition, info).dwTypeData; //now that info has the length of the string it can send the actual string through dwTypeData
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        hPopupMenu = CreatePopupMenu();
        InsertMenu(hPopupMenu, 0, MF_BYPOSITION | MF_BITMAP, ID_TROLL, trollBmp); //when using MF_BITMAP you gotta pass a bitmap (obvisoulsylg) //(wait why is it so big i thought it would shrink it (oh i gotta use InsertMenuItem))
        InsertMenu(hPopupMenu, 0, MF_BYPOSITION | MF_STRING, ID_SEX, "SEX?");
        InsertMenu(hPopupMenu, 0, MF_BYPOSITION | MF_STRING, ID_SKIBIDI, "skibidi");

        let iteminfo = {fMask: MIIM_ID | MIIM_CHECKMARKS | MIIM_STRING, wID: ID_TROLL2, hbmpChecked: bruhchecked, hbmpUnchecked: bruhunchecked, dwTypeData: "troll mode max:"} //https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-menuiteminfow
        print(InsertMenuItem(hPopupMenu, 0, true, iteminfo));

        //print(GetMenuItemInfo(hPopupMenu, ID_TROLL2, false, {fMask: MIIM_STRING})); //by specifying fByPosition as false, the position parameter targets the menu item with the id that you supply through position 
        print(GetMenuItemInfoString(hPopupMenu, ID_TROLL2, false)); //by specifying fByPosition as false, the position parameter targets the menu item with the id that you supply through position 

        iteminfo = {fMask: MIIM_STRING | MIIM_BITMAP, dwTypeData: "oh shit this icecream is fucking freezing my teeth HEPL", hbmpItem: HBMMENU_POPUP_CLOSE} //https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-menuiteminfow
        print(InsertMenuItem(hPopupMenu, 0, true, iteminfo));

        InsertMenu(hPopupMenu, 0, MF_BYPOSITION | MF_OWNERDRAW, 1000, 2093); //i wonder what's for dinner (for MF_OWNERDRAW the last parameter is passed through the lparam->itemData member of WM_MEASUREITEM and WM_DRAWITEM)

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
                print("troll 2 \nbreak;"); //oh i don't think i've tried putting a newline in a print
                break;
        }
    }else if(msg == WM_MEASUREITEM) {
        //unfortunately WM_MEASUREITEM has it's LPARAM point to a MEASUREITEMSTRUCT but you have to change it by pointing to it like struct->itemWidth = blahblahblah anyways to solve this problem i could make a function like Set("whatever", value) but that would be lame... the real man's solution would be to use the same principle that javascript classes use when you uset the set keyword before a function
        //or i could make a wrapper object in js that writes that shit for me (much easier)
        //i feel like actually trying to do the former would take forever i have no idea how you would do that in v8 land (i still don't know how to MAKE a class yet (which i guess i should figure out))
        //wait a second i think i just found a solution READING THROUGH OLD DOCS! (OH they moved the GOOD docs to another place and i finally found it)
        //well damn i could've sworn on my life that v8 didn't have good docs but i MIGHT have not been looking hard enough (which shoot im suprised)
        const lpmis = GET_MEASURE_ITEM_STRUCT_LPARAM(lp);
        print(lpmis.itemData, "breathe"); //"if i come around you can i be myself" (NOT DRAKE)
        const dc = GetDC(hwnd);
        const last = SelectObject(dc, GetDefaultFont());
        
        const size = GetTextExtentPoint32(dc, "erm... what the sigma! 🤓🤓🤓🤓");
        print(size);
        lpmis.itemWidth = size.width; //directly setting these values is literally equal to lpmis->itemWidth
        lpmis.itemHeight = size.height;

        print(lpmis);

        SelectObject(dc, last);
        ReleaseDC(hwnd, dc);
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