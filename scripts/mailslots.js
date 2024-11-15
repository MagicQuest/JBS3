//open mailslots.js first then writetomailslot.js
//the only reason i create i window here is so i can use SetTimer to check periodically (because the idea i had in mind for mailslots was so that i could eval code into another jbs process)

class Bitmap { //helper function for drawing to the screen easy becaue seinrrffnkjenfknenf nekfnfk
    constructor(hwnd, width, height) {
        this.hwnd = hwnd;
        this.width = width;
        this.height = height;
        this.dc = GetDC(this.hwnd);
        this.bitmap = CreateCompatibleBitmap(this.dc, this.width, this.height);
        this.i = 0; //for drawText
    }

    static asDrawable(dc, bitmap, callback) {
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bitmap);
        callback(memDC);
        DeleteDC(memDC);
    }

    getDrawable(callback) {
        Bitmap.asDrawable(this.dc, this.bitmap, callback);
    }

    drawText(text) {
        //GetTextExtentPoint32()
        this.getDrawable((function(memDC) {
            //print(this);
            TextOut(memDC, 0, this.i*16, text);
        }).bind(this));
        this.i++;
    }

    resize(nw, nh) {
        //old = this.bitmap;
        //const newBitmap = new Bitmap(this.hwnd, nw, nh);
        const newBitmap = CreateCompatibleBitmap(this.dc, nw, nh);
        Bitmap.asDrawable(this.dc, newBitmap, (function(newMDC) { 
            this.getDrawable(function(memDC) { //lowkey this part is kinda ugly but i guess it's better than making 2 memDCs inline here
                BitBlt(newMDC, 0, 0, nw, nh, memDC, 0, 0, SRCCOPY);
            });
        }).bind(this));

        this.width = nw;
        this.height = nh;

        DeleteObject(this.bitmap);
        this.bitmap = newBitmap;

        //this = newBitmap; //oh yeah about that hold on...
        //this.draw
        //this.width = nw;
        //this.height = nh;
    }

    destroy() {
        DeleteObject(this.bitmap);
        ReleaseDC(this.hwnd, this.dc);
    }
}


let w = 512;
let h = 512;

let mailslot = NULL;
const path = `\\\\.\\mailslot\\jbs_sigmas`; //matches with the path in writetomailslot.js

let textBitmap;

function ReadSlot() {
    //const hEvent = CreateEvent(false, false, "mailslottest");
    //const ov = {Offset: 0, OffsetHigh: 0, hEvent}; //idk what the point of this is
    //const ov = new OVERLAPPED(NULL, NULL, 0, 0, hEvent); //this is now valid (you don't even need to use the new keyword but it feels right)
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

let realprint = print;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        mailslot = CreateMailslot(path, NULL, MAILSLOT_WAIT_FOREVER);
        if(mailslot == INVALID_HANDLE_VALUE) {
            print("failed to create mailslot for some reason ", g=GetLastError(), _com_error(g));
        }
        print(mailslot);
        print(GetMailslotInfo(mailslot));
        //damn i gotta add ReadFile to read it

        textBitmap = new Bitmap(hwnd, w, h);

        print = function(...args) {
            textBitmap.drawText(args.join(" ").toString()); //lol uidk
            realprint(...args);
        }

        print("waiting for messages...");
        SetTimer(hwnd, 0, 100);
    }else if(msg == WM_TIMER) {
        if(messages = ReadSlot()) { //lol
            for(const message of messages) {
                if(message.indexOf("$") == 0) {
                    try {
                        eval(message.substring(1)); //lol i accidently forgot to get rid of the $ so i had to get around it by using $print = print and then $print(21);
                    }catch(e) {
                        const console = GetStdHandle(STD_OUTPUT_HANDLE);
                        //print(console, GetConsoleWindow());
                        SetConsoleTextAttribute(console, 4);
                        printNoHighlight(e.toString());
                        SetConsoleTextAttribute(console, 7);
                    }
                }
                realprint("Read:",message); //lol using realprint because i want to draw read messages differently here
                textBitmap.drawText(">>> "+message);
            }
        }

        const dc = GetDC(hwnd);
        textBitmap.getDrawable(bitmapMDC => {
            BitBlt(dc, 0, 0, textBitmap.width, textBitmap.height, bitmapMDC, 0, 0, SRCCOPY);
        });
        ReleaseDC(hwnd, dc);
    }else if(msg == WM_SIZE) {
        w = LOWORD(lp);
        h = HIWORD(lp);
        textBitmap.resize(w, h);
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