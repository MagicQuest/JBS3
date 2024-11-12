const w = 512;
const h = 512;

let mailslot = NULL;
const path = `\\\\.\\mailslot\\jbs_sigmas`;

function ReadSlot() {
    //const hEvent = CreateEvent(false, false, "mailslottest");
    //const ov = {Offset: 0, OffsetHigh: 0, hEvent}; //idk what the point of this is
    //print(hEvent);
    //if(hEvent == NULL) {
    //    return "fuck";
    //}

    let info = GetMailslotInfo(mailslot);
    if(!info) {
        print(`GetMailslotInfo failed with [ ${g=GetLastError()} ] ${_com_error(g)}`);
        return;
    }

    if(info.nextSize == MAILSLOT_NO_MESSAGE) {
        return;
    }

    let strings = [];

    while(info.messageCount != 0) {
        //print(info);
        let res = ReadFile(mailslot, info.nextSize); //, ov);
        if(!res) {
            print(`ReadFile failed with [ ${g=GetLastError()} ] ${_com_error(g)}`);
            return;
        }

        strings.push(res);

        info = GetMailslotInfo(mailslot);
        if(!info) {
            print(`GetMailslotInfo failed with [ ${g=GetLastError()} ] ${_com_error(g)}`);
            return;
        }
    }
    //CloseHandle(hEvent);
    return strings;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        mailslot = CreateMailslot(path, NULL, MAILSLOT_WAIT_FOREVER);
        if(mailslot == INVALID_HANDLE_VALUE) {
            print("failed to create mailslot for some reason ", g=GetLastError(), _com_error(g));
        }
        print(mailslot);
        print(GetMailslotInfo(mailslot));
        //damn i gotta add ReadFile to read it

        print("waiting for messages...");
        SetTimer(hwnd, 0, 100);
    }else if(msg == WM_TIMER) {
        if(messages = ReadSlot()) { //lol
            for(const message of messages) {
                print("Read:",message);
            }
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        print(CloseHandle(mailslot));
    }
}


const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "mailslots because i just learned about them and i already wanted to somehow eval into another jbs proceszs ", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);