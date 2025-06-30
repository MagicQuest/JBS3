//don't worry about this yet
//https://stackoverflow.com/questions/59079610/scrub-through-memory-arbitrarily-while-avoiding-read-access-violations?rq=3
//https://stackoverflow.com/questions/496034/most-efficient-replacement-for-isbadreadptr
//https://stackoverflow.com/a/683111 (lol a pointer to the stack (in the tune of don't copy my flow))

//https://stackoverflow.com/questions/5419356/is-there-a-way-to-redirect-stdout-stderr-to-a-string

//ReadProcessMemory
//VirtualQuery(Ex)

// 2n**(2n**30n-1n)-1n is apparently the largest representable bigint in js (https://stackoverflow.com/a/70537884)

//check Local<Object> value in locals window or something and get the private _location pointer and see how various types of data are stored (specifically json)

eval(require("fs").read(__dirname+"/mastercontrols.js"));

const w = 594;
const h = 800;

let d2d, colorBrush, font, roundStrokeStyle; //required!
let monofont;

const imagebase = GetModuleHandle(NULL);

function toHexPadded(number) {
    let hex = number.toString(16);
    if(hex.length == 1) {
        hex = "0"+hex;
    }
    return hex;
}

//making sure the memory we're about to read is committed, accessable, and not a guard page
function ReadableQuery(mbi) {
    return mbi.State != MEM_FREE && mbi.AllocationProtect != PAGE_NOACCESS && mbi.Protect > PAGE_NOACCESS && (mbi.Protect & PAGE_GUARD) != PAGE_GUARD;
}

const object = {token: "70lengthstringnigga", mango: 5};
print(get_location_(object)); //idk how v8 handles the location_ or what the data stored in it is

//minified
//function GetFullSizeOfPageRegionAtAddress(p,a){vqe=VirtualQueryEx;s=0;i=vqe(p,a).AllocationBase;ss=i;while(ss){const{AllocationBase,RegionSize}=vqe(p,i);if(AllocationBase){i+=RegionSize;s+=RegionSize}else{return s}}};
function GetFullSizeOfPageRegionAtAddress(process, address) {
    let size = 0;
    let i = VirtualQueryEx(process, address).AllocationBase;
    let success = i;
    while(success) {
        const mbi = VirtualQueryEx(process, i);
        if(ReadableQuery(mbi)) {
            i+=mbi.RegionSize;
            size+=mbi.RegionSize;
        }else {
            return size;
        }
    }
}

function FindValueInWholeRegion(process, address, value, string) {
    const baseaddr = VirtualQueryEx(process, address).AllocationBase;
    //const size_t = GetFullSizeOfPageRegionAtAddress(process, baseaddr); //hell yeah broygher (well actually ill just write it here so i can be efficient)
    if(string) {
        value = value.split("").map(c=>c.charCodeAt(0));
    }
    let i = baseaddr;
    let success = i;
    while(success) {
        const {State, RegionSize} = VirtualQueryEx(process, i);
        if(State != MEM_FREE) {
            const region = ReadProcessMemory(process, i, RegionSize);
            for(let j = 0; j < RegionSize; j++) {
                let correct = 0;
                for(let k = 0; k < value.length; k++) {
                    correct += region[j+k] == value[k]; //region[i+j+k] //oh my god (wait that shit was wrong LMAO)
                }
                if(correct == value.length) {
                    return i+j;
                }
            }
            i+=RegionSize;
        }
        success = State != MEM_FREE;
    }
}

function SearchForNLengthStringsInVirtualMemory(process, n) {
    const basembi = VirtualQueryEx(process, 0);

    n+=2; //so we can check for the null terminator behind and after (i guess)
    let i = basembi.BaseAddress;
    let success = true;
    let occurences = [];
    print(n);
    while (success) {
        const mbi = VirtualQueryEx(process, i);
        print(i, mbi.RegionSize);
        /*if(mbi.RegionSize == 0) {
            PrintFormattedVirtualQuery(mbi);
        }*/
        success = mbi.RegionSize; //i think if there are no further pages, RegionSize is 0
        if(ReadableQuery(mbi) && mbi.Type == MEM_PRIVATE) {
            const region = ReadProcessMemory(process, i, mbi.RegionSize);
            if(!region) { //progbably shouoldn't happen [[unlikely]]
                print("regi9on was cap nigga FUCK!");
            }
            for(let j = 0; j < mbi.RegionSize; j++) {
                let correct = 0;
                for(let k = 0; k < n; k++) {
                    const byte = region[j+k];
                    
                    //i kept writing these wrong and when i ran them v8 would run out of heap memory...

                    //if(byte >= 32 && byte <= 126) {
                    //    correct++;
                    //}else if(byte == 0) {
                    //    correct++;
                    //}
                    //if(byte >= 32 && byte <= 126 && k < n-1) {
                    //    correct++;
                    //}else if(byte == 0) {
                    //    correct++;
                    //}
                    if(byte >= 32 && byte <= 126 && k != 0 && k != n-1) {
                        correct++;
                    }else if(byte == 0 && (k == n-1 || k == 0)) {
                        correct++;
                    }
                }
                if(correct == n) {
                    //return i+j;
                    occurences.push(i+j); //StringFromPointer(i+j+1));
                }
            }
        }
        i+=mbi.RegionSize;
    }
    return occurences;
}

//function cmpmyshit(a,b){const r=[];for(const c of a){if(b.includes(c)){r.push(c);}}return r;}
function cmpmyshit(a, b) {
    const r = [];
    for(const a1 of a) {
        if(b.includes(a1)) {
            r.push(a1);
        }
    }
    return r;
}

function StringToHexArr(str, towstring) {
    if (towstring) {
        value = value.split("").map(e => e + "\0").join("").split("").map(e => e.charCodeAt(0));
    } else {
        value = value.split("").map(c => c.charCodeAt(0));
    }
    return value;
}

function WatchForAllOccurrencesOfValue(process, value, string) {
    const first = FindAllOccurrencesOfValueInVirtualMemory(process, value, string);
    const results = [];

    return function(newvalue, string) {
        //TOP (tuff)
        if (string) {
            newvalue = StringToHexArr(newvalue, string-1);
        }
        const res = [];
        //const second = FindAllOccurrencesOfValueInVirtualMemory(process, newvalue, string);
        //const res = cmpmyshit(first, second);
        //let's try to read all the things from before
        //globalThis.watchdog = WatchForAllOccurencesOfValue(panes[0].hProcess, [9, 0, 0, 0], false);
        for (const addr of first) {
            const mbi = VirtualQueryEx(process, addr);
            if (ReadableQuery(mbi)) {
                const region = ReadProcessMemory(process, addr, newvalue.length);
                if (!region) {
                    print("err that shouldnb't really happen unless newvalue.length is bigger than le page/whatever");
                }
                //print(addr, region[0], newvalue[0]);
                if (region.reduce((acc, val, i) => acc + (val == newvalue[i]), 0) == newvalue.length) {
                    res.push(addr);
                }
            } else {
                print("can't read this address anymore", addr);
            }
        }
        print(res);
        //results.push(res);
    }
}

function get_dword_bytes(number) { //little endian
    //i'm using [... & 0b11111111] so i only get the first 8 bytes
    //0b11111111 == 255 
    return [(number) & 255, (number >> 8) & 255, (number >> 16) & 255, (number >> 24) & 255];
}

function* getValuesInArrayAtIndex(arr, i) { //actually my first time using a generator function!!!
    for(let j = i; j < arr.length; j++) {
        yield arr[j];
    }
}

function SetPeggleBallCount(peggleProcess, newBallCount, ballCountAddress, currentBallCount, profileName) {
    if (ballCountAddress == 0) {
        ballCountAddress = FindPeggleBallsAddress(peggleProcess, currentBallCount, profileName);
    }
    //well i would write process memory here but i don't think i added it yet...
    if(WriteProcessMemory(peggleProcess, ballCountAddress, new Uint8Array(get_dword_bytes(newBallCount)))) {
        
    }else {
        const g = GetLastError();
        print("WriteProcessMemory failed (SetPeggleBallCount)!", g, _com_error(g));
    }
}

//aw this one doesn't work straight up you have to activate the ability first by hitting one of  the green ones (until i find out what it changes)
//also abilities are weird and this only works for renfield
function SetPeggleSpecialAbilityCount(peggleProcess, newAbilityCount, ballCountAddress, currentBallCount, profileName) {
    if (ballCountAddress == 0) {
        ballCountAddress = FindPeggleBallsAddress(peggleProcess, currentBallCount, profileName);
    }
                          //relative to the ball count address, the address of the special ability counter is 136 bytes away lol
    if (WriteProcessMemory(peggleProcess, ballCountAddress+136, new Uint8Array(get_dword_bytes(newAbilityCount)))) {

    } else {
        const g = GetLastError();
        print("WriteProcessMemory failed (SetPeggleSpecialAbilityCount)!", g, _com_error(g));
    }
}

//function FindPeggleBallsAddress(peggleProcess, currentBallCount, profileName) { //hell yeah brother this might be fool proof
//    //the ball count during a peggle game is stored at some random place in the heap (i think?)
//    //and it's near your profile name (+20 bytes)
//
//    const DWORD_BYTES = get_dword_bytes(currentBallCount); //little endian
//
//    const addrawrr = FindAllOccurrencesOfValueInVirtualMemory(peggleProcess, DWORD_BYTES, false);
//    for(const address of addrawrr) {
//        //technically they should all still be readable right?
//        const region = ReadProcessMemory(peggleProcess, address, 20 + profileName.length); //reading 24 because the name is stored at +20 and the length of the name is 4 (i think?)
//        if(region) {
//            //let's get the last few bytes of the region and see if they equal our name
//            // let readName = "";
//            /*for(let i = 24-profileName.length; i < 24; i++) { //hold on let's do something cool instead
//                readName += String.fromCharCode();
//            }*/
//            const readName = String.fromCharCode(...getValuesInArrayAtIndex(region, 24-profileName.length)); //yooooo this is lit
//            //print(address, readName, profileName);
//            if(readName == profileName) {
//                print("FOUND!", address);
//                return address;
//                // break;
//            }
//        }else {
//            print(`couldn't read memory at address ${address} but the ball count probably wasn't there anyways?`);
//        }
//    }
//
//    print("well we tried :(");
//}

function FindPeggleBallsAddress(peggleProcess) { //nah we don't even need this extra information, i've spent the last like 10 days cracking peggle and now i know how to get the ball count EFFICIENTLY
    //0x687394 holds a pointer to the "ThunderballApp" object which then also holds a pointer to a "Board" object which THEN holds a pointer to a "LogicMgr" object
    //this LogicMgr object holds the amount of balls we have in the game
    let uint8address = ReadProcessMemory(peggleProcess, 0x687394, 4);
    const ThunderballApp = new DataView(uint8address.buffer).getInt32(0, true); //little endian

    uint8address = ReadProcessMemory(peggleProcess, ThunderballApp+0x7B8, 4);
    const Board = new DataView(uint8address.buffer).getInt32(0, true);

    uint8address = ReadProcessMemory(peggleProcess, Board+0x154, 4);
    const LogicMgr = new DataView(uint8address.buffer).getInt32(0, true);

    print(ThunderballApp, Board, LogicMgr);

    //now normally this is 0 and i have yet to see what it does (i think that when you are playing against a bot, this value is 1 when it's the bot's turn (but for some reason i haven't actually tested this theory lol))
    uint8address = ReadProcessMemory(peggleProcess, LogicMgr+0x128, 4);
    const eax = new DataView(uint8address.buffer).getInt32(0, true);

    //esi is LogicMgr
    //add dword ptr [esi+eax*4+0x17C], ecx
    return LogicMgr+(eax*4)+0x17C;
}

//faster speeds could likely be achieved if i translated the bytes to a number by bit shifting and comparing the bit shifted values of those shits too so it was be O(n) instead of like O(n*value_length)
//wait nevermind that would only work if i knew the size of the value at "compile" time
//let's see tomorrow if the benchmark says strings or number comparisons are faster this way (so compare the current way with the bitshift method :eyes:)
function FindAllOccurrencesOfValueInVirtualMemory(process, value, string) { //wait this works way quicker than i expected B)
    const basembi = VirtualQueryEx(process, 0);
    if (string) {
        value = StringToHexArr(value, string - 1);
    }
    //convert value to big int
    let i = basembi.BaseAddress;
    let success = true;
    let occurences = [];
    while (success) {
        const mbi = VirtualQueryEx(process, i);
        print(i, mbi.RegionSize);
        /*if(mbi.RegionSize == 0) {
            PrintFormattedVirtualQuery(mbi);
        }*/
        success = mbi.RegionSize; //i think if there are no further pages, RegionSize is 0
        if(ReadableQuery(mbi)) {
            const region = ReadProcessMemory(process, i, mbi.RegionSize);
            if(!region) { //progbably shouoldn't happen [[unlikely]]
                print("regi9on was cap nigga FUCK!");
            }
            for(let j = 0; j < mbi.RegionSize; j++) {
                let correct = 0;
                for(let k = 0; k < value.length; k++) {
                    correct += region[j+k] == value[k];
                }
                if(correct == value.length) {
                    //return i+j;
                    occurences.push(i+j);
                }
            }
        }
        i+=mbi.RegionSize;
    }
    return occurences;
}

function ReadCheckedMemory(process, address, bytes) {
    //oh wait i could use virtual query to see which parts can't be read (ReadProcessMemory gives up if it can't COMPLETELY read through the memory (and will tell you that it could only read part of it))
    let offset = 0;
    let offsetEnd = 0;
    let pageIndices = {};
    let memory = undefined;
    const mbi = VirtualQueryEx(process, address);
    const rs = mbi.RegionSize-(address-mbi.BaseAddress);
    // print("offset,", address, mbi.BaseAddress, address-mbi.BaseAddress);
    pageIndices[mbi.BaseAddress-address] = 1;
    if(ReadableQuery(mbi)) {
        //ReadCheckedMemory(-1, 500, 100)
        //mbi = {BaseAddress: 500, AllocationBase: 500, RegionSize: 75}
        //rs = 75-(500-500)
        //rs = 75
        //75 is smallter than 100
        //offsetEnd = 100-75
        if(rs < bytes) { //if this region is smaller than we want
            print("region is smaller than we want but pointer is valid (lets see if it gets any bigger tho)");
            let i = rs;
            let success = true;
            while(success) { //same kind of technique in GetFullSizeOfPageRegionAtAddress
                const newmbi = VirtualQueryEx(process, address+i);
                //print(i, newmbi);
                //if(success = (newmbi.State != MEM_FREE && newmbi.AllocationProtect != PAGE_NOACCESS)) { //a random portion of memory i kept trying to look at would fail and it's because i wasn't checking the protection...
                if(success = ReadableQuery(newmbi)) {
                    pageIndices[newmbi.BaseAddress-(address)] = 2;
                    if(i+newmbi.RegionSize > bytes) {
                        i = bytes;
                        break; 
                    }
                    i+=newmbi.RegionSize;
                }
            }
            print(address, rs, bytes, i);
            offsetEnd = bytes-i; //yeah i think
        }else {
            print("whole region readable");
        }
    }else {
        //ReadCheckedMemory(-1, 100, 5000)
        //assuming mbi = {BaseAddress: 0, AllocationBase: 0, RegionSize: 500}
        //mbi.AllocationBase == 0
        //rs = 500-(100-0);
        //400 is bigger than 5000
        //nextvalidregion = 0+500
        //offset = 500-100; //true.
        //newmbi = {BaseAddress: 500, AllocationBase: 500, RegionSize: 1048576}
        //1048576 is bigger than 5000-400
        //memory = ReadProcessMemory(-1, 100+400, 5000-400-0)

        //lets run that back
        //newmbi = {BaseAddress: 500, AllocationBase: 500, RegionSize: 2048}
        //2048 is NOT bigger than 5000-400
        //offsetEnd = (5000-400)-2048
        //memory = ReadProcessMemory(-1, 100+400, 5000-400-2552)
        //oh hell yeah my math checks out
        if(rs > bytes) { //whole area unreadable... (if mbi.AllocationBase is 0 that means we are trying to read a patch of unused memory and if RegionSize is bigger than bytes that means the next region is not even close)
            print("whole region unreadable");
            PrintFormattedVirtualQuery(mbi);
            offset = bytes;
        }else {
            print("next regions might be readable");
            const nextvalidregion = mbi.BaseAddress+mbi.RegionSize;
            offset = nextvalidregion-address; //probably
            const newmbi = VirtualQueryEx(process, nextvalidregion);
            //no special rs variable for this if statement because nextvalidregion will be the start of a region of pages
            if(newmbi.RegionSize < bytes-offset) { //region smaller than we want :(
                print("partial partial region smaller than we want (lets see if it is bigger than we think...)");
                let i = newmbi.RegionSize;
                let success = true;
                while(success) { //same kind of technique in GetFullSizeOfPageRegionAtAddress
                    const newermbi = VirtualQueryEx(process, nextvalidregion+i);
                    //if(success = (State != MEM_FREE && AllocationProtect != PAGE_NOACCESS)) {
                    if(success = ReadableQuery(newermbi)) {
                        pageIndices[nextvalidregion+i-mbi.BaseAddress] = 3;
                        if(i+newermbi.RegionSize > bytes-offset) {
                            i = bytes-offset;
                            break; 
                        }
                        i+=newermbi.RegionSize;
                    }
                }
                offsetEnd = (bytes-offset)-i;
            }else if(!ReadableQuery(newmbi)) {
                print("partial bad too? (this whole area is unreadable i guess?)");
                offset = bytes;
            }else {
                pageIndices[nextvalidregion-address] = 4;
            }
        }
    }
    print(address, address+offset, bytes-offset-offsetEnd, pageIndices);
    memory = ReadProcessMemory(process, address+offset, bytes-offset-offsetEnd);
    if(!memory) {
        const g = GetLastError();
        print(`ReadCheckedMemory failed! (${memory}, ${offset}, ${offsetEnd}, ${bytes}, ${rs})`,g, _com_error(g));
        PrintFormattedVirtualQuery(VirtualQueryEx(process, address));
    }
    return [memory, offset, offsetEnd, pageIndices];
    /*if(mbi.AllocationBase) {

    }*/

    /*
    let memory;
    //const mbi = VirtualQueryEx(process, address); //virtual query gives you details about the whole page (or region of pages?) where base address resides!!!
    //print(mbi);
    let offset = 0;
    //if(!mbi.AllocationProtect) { //allocation protect is 0 when the caller doesn't have access (actually im not sure if that means when the caller doesn't have access to the protection or the page as a whole)
        for(; offset < bytes; offset++) {
            //just like that and im back bruh
            const {AllocationBase} = VirtualQueryEx(process, address+offset);
            if(AllocationBase) {
                memory = ReadProcessMemory(process, address+offset, bytes-offset);
                break;
            }
        }
    //}else {
    //    memory = ReadProcessMemory(process, address, bytes);
    //}
    if(!memory) {
        const g = GetLastError();
        print(`ReadCheckedMemory failed! (${memory}, ${offset}, ${bytes})`,g, _com_error(g));
        print(VirtualQueryEx(process, address));
    }
    print(offset);
    return [memory, offset];
    */
}

const protectconsts = [
    "PAGE_NOACCESS",
    "PAGE_READONLY",
    "PAGE_READWRITE",
    "PAGE_WRITECOPY",
    "PAGE_EXECUTE",
    "PAGE_EXECUTE_READ",
    "PAGE_EXECUTE_READWRITE",
    "PAGE_EXECUTE_WRITECOPY",
    "PAGE_GUARD",
    "PAGE_NOCACHE",
    "PAGE_WRITECOMBINE",
    "PAGE_GRAPHICS_NOACCESS",
    "PAGE_GRAPHICS_READONLY",
    "PAGE_GRAPHICS_READWRITE",
    "PAGE_GRAPHICS_EXECUTE",
    "PAGE_GRAPHICS_EXECUTE_READ",
    "PAGE_GRAPHICS_EXECUTE_READWRITE",
    "PAGE_GRAPHICS_COHERENT",
    "PAGE_GRAPHICS_NOCACHE",
    "PAGE_ENCLAVE_THREAD_CONTROL",
    "PAGE_REVERT_TO_FILE_MAP",
    "PAGE_TARGETS_NO_UPDATE",
    "PAGE_TARGETS_INVALID",
    "PAGE_ENCLAVE_UNVALIDATED",
    "PAGE_ENCLAVE_MASK",
    "PAGE_ENCLAVE_DECOMMIT",
    "PAGE_ENCLAVE_SS_FIRST",
    "PAGE_ENCLAVE_SS_REST",
];

const stateconsts = [
    "MEM_COMMIT",
    "MEM_RESERVE",
    "MEM_FREE",
];

const typeconsts = [
    "MEM_PRIVATE",
    "MEM_MAPPED",
    "MEM_IMAGE",
]

function PrintFormattedVirtualQuery(mbi) {
    print(`{`);
    for(const key in mbi) {
        const value = mbi[key];
        let formatted = "";
        if(key.includes("Protect")) {
            for(const $enum of protectconsts) { //enum is reserved...
                const aenuml = globalThis[$enum]; //actual enum lol
                if((value & aenuml) == aenuml) {
                    formatted += formatted.length ? " | "+$enum : $enum;
                }
            }
        }else if(key == "State") {
            for(const $enum of stateconsts) { //enum is reserved...
                const aenuml = globalThis[$enum]; //actual enum lol
                if((value & aenuml) == aenuml) {
                    formatted += formatted.length ? " | "+$enum : $enum;
                }
            }
        }else if(key == "Type") {
            for(const $enum of typeconsts) { //enum is reserved...
                const aenuml = globalThis[$enum]; //actual enum lol
                if((value & aenuml) == aenuml) {
                    formatted += formatted.length ? " | "+$enum : $enum;
                }
            }
        }else {
            formatted = value;
        }
        if(value == 0) {
            formatted = value;
        }
        print(`    ${key}:`, formatted);
    }
    print("}");
}

function hProcessFromHWND(hwnd) {
    const {processID} = GetWindowThreadProcessId(hwnd);
    if(!processID) {
        const g = GetLastError();
        print("GetWindowThreadProcessId failed", g, _com_error(g));
    }
    let hProcess = OpenProcess(PROCESS_ALL_ACCESS, false, processID); //OpenProcess(PROCESS_VM_READ | PROCESS_QUERY_INFORMATION, false, processID); //oh lol i forgot query!
    if(!hProcess) {
        const g = GetLastError();
        print(`OpenProcess failed (what was it tho ${hProcess})`, g, _com_error(g));
    }
    return hProcess;
}

function IsAcceptableTitle(t) {
    const badlist = ["amd dvr overlay", "GDI+ Window", "DesktopWindowXamlSource", ".NET-BroadcastEventWindow", "GlobalHiddenWindow", "WUIconWindow", "MediaContextNotificationWindow", "SystemResourceNotifyWindow", "WISPTIS", "DDE Server Window", "Default IME", "MSCTFIME UI", "CiceroUIWndFrame", "HiddenWindow", "PopupHost"];
    for(let title of badlist) {
        if(t.includes(title)) {
            return false;
        }
    }
    return true;
}

class MemoryPane extends Parent {
    // x = 0;
    // y = 0;
    // width = w;
    // height = h;

    //addressBox = undefined;
    //windowBox = undefined;
    //nextPageButton = undefined;
    //children = []; //now in basepane
    memory = undefined;

    constructor(hwnd) {
        super(0, 0, w, h, undefined);
        this.defaultHT = [WHEEL, this];
        const addressBox = new EditControl(0, 0, w, 18, undefined, GetModuleHandle(NULL), function(textbox) {
            //this.verifyInput();
            textbox.value = new Function(`return (${textbox.value})`)(); //lmao that's that fancy eval
            print("looking around:",textbox.value);
            this.readMemory();
        }, this);
        const windowBox = new EditDropdownControl(0, addressBox.height, w, 18, [], "memoview.js", function(windowBox) {
            //ppsspp
            const hwnd = FindWindow(NULL, windowBox.value);
            const newProcess = hProcessFromHWND(hwnd);
            if(newProcess) {
                CloseHandle(this.hProcess);
                this.hProcess = newProcess;
            }
            //CloseHandle(this.hProcess);
            this.readMemory();
        }, function() {
            const titles = [];
            EnumWindows(function(hwnd) {
                const t = GetWindowText(hwnd);
                const {left, top} = GetWindowRect(hwnd);
                const client = GetClientRect(hwnd);
                if(t.length && client.right>0 && client.bottom>0 && IsAcceptableTitle(t)) {
                    titles.push(t);
                }
                //else if(t.length){
                //    print(t, left, top);
                //}
            });
            return titles;
        }, this);
        const buttonList = new HorizontalListBox(0, windowBox.y+windowBox.height, w, 18, []);
        //width and height for the children of button list are 0 because they are initialized when appendChild/resize is called
        const nextPageButton = new TextButtonControl(0, 0, 0, 0, "Skip to next page", [0.0, 0.0, 0.0], [.8, .8, .8], function(button, mouse) {
            const mbi = VirtualQueryEx(this.hProcess, addressBox.value);
            //const rs = mbi.RegionSize-(this.addressBox.value-mbi.BaseAddress);
            addressBox.value = mbi.BaseAddress+mbi.RegionSize; //this.addressBox.value+rs;
            this.readMemory();
        }, this);
        const nextRegionButton = new TextButtonControl(0, 0, 0, 0, "Skip through whole region", [0.0, 0.0, 0.0], [.8, .8, .8], function(button, mouse) { //i could've sworn this worked better before i rewrote mastercontrols but how could that have possible changed anything?
            const mbi = VirtualQueryEx(this.hProcess, addressBox.value);
            // PrintFormattedVirtualQuery(mbi);
            // print(addressBox.value);
            addressBox.value = mbi.BaseAddress+GetFullSizeOfPageRegionAtAddress(this.hProcess, addressBox.value);
            this.readMemory();
        }, this);

        const checkboxLabelList = new HorizontalListBox(0, 0, 0, 0, []);
        const checkboxlabel = new StaticControl(0, 0, 0, 0, "constant:");
        const realtimeCheckbox = new CheckboxControl(0, 0, 0, 0, false, function(checkbox) {
            const randomtimerid = 21; //can't be 0 lol
            if(checkbox.value) {
                SetTimer(hwnd, randomtimerid, 100);
            }else {
                KillTimer(hwnd, randomtimerid);
            }
        }, this);
        checkboxLabelList.appendChild(checkboxlabel);
        checkboxLabelList.appendChild(realtimeCheckbox);

        //buttonList.list.push(nextPageButton);
        buttonList.appendChild(nextPageButton);
        buttonList.appendChild(nextRegionButton);
        buttonList.appendChild(checkboxLabelList);

        const searchBox = new HorizontalListBox(0, buttonList.y+buttonList.height, w, 18, []);
        const searchEdit = new EditControl(0, 0, 0, 0, "string", "", undefined, undefined);
        const innerListBox = new HorizontalListBox(0, searchBox.y, 0, 0, []);
        const searchStringButton = new TextButtonControl(0, 0, 0, 0, "Search for string occurence", [0.0, 0.0, 0.0], [.8, .8, .8], function(button, mouse) {
            const addr = FindValueInWholeRegion(this.hProcess, addressBox.value, searchEdit.value, true);
            if(addr) {
                addressBox.value = addr;
                this.readMemory();
            }else {
                print("couldn't find",searchEdit.value);
            }
        }, this);
        const searchHexButton = new TextButtonControl(0, 0, 0, 0, "Search for hex occurence", [0.0, 0.0, 0.0], [.8, .8, .8], function(button, mouse) {
            //aw man i was trying to do this BANGER one liner but i think techinically we're in strict mode or something because it tells me hex is not defined
            //const addr = FindValueInWholeRegion(this.hProcess, addressBox.value, (hex=Number(searchEdit.value).toString(16),hex=hex.length%2==1?"0"+hex:hex,hex.match(/[A-z0-9]{2}/g)), false);
            let hex = Number(searchEdit.value).toString(16);
            if(hex.length % 2 == 1) {
                hex = "0"+hex;
            }
            hex = hex.match(/[A-z0-9]{2}/g).map(n=>parseInt(n, 16));
            print(hex);
            const addr = FindValueInWholeRegion(this.hProcess, addressBox.value, hex, false);
            if(addr) {
                addressBox.value = addr;
                this.readMemory();
            }else {
                print("couldn't find",searchEdit.value);
            }
        }, this);
        
        innerListBox.appendChild(searchStringButton);
        innerListBox.appendChild(searchHexButton);
        searchBox.appendChild(searchEdit);
        searchBox.appendChild(innerListBox);

        //since i know where i want it im just gonna set the x and y myself (yeah i honestly don't really know why i did it like that ever...)
        //addressBox.x = 0;
        //addressBox.y = 0;
        //windowBox.x = 0;
        //windowBox.y = addressBox.height;
        ////nextPageButton.x = 0;
        ////nextPageButton.y = this.windowBox.y+this.windowBox.height;
        //buttonList.x = 0;
        //buttonList.y = windowBox.y+windowBox.height;
        //searchBox.x = 0;
        //searchBox.y = buttonList.y+buttonList.height;
        //this.children.push(addressBox, windowBox, buttonList, searchBox);
        this.appendChild(addressBox);
        this.appendChild(windowBox);
        this.appendChild(buttonList);
        this.appendChild(searchBox);
        this.hProcess = GetCurrentProcess(); //-1
        //const sumn = FindWindow(NULL, "Command Prompt");
        //print(sumn, GetWindowThreadProcessId(sumn));
        //const hProcess = OpenProcess(PROCESS_VM_READ, false, GetWindowThreadProcessId(sumn).processID);
        print(this.hProcess);
        //if(!this.hProcess) {
        //    const g = GetLastError();
        //    print(g, _com_error(g));
        //}
        this.readMemory();
    }

    readPartialMemory(scrollDirection) {
        const {amountthatcanfitonleftsideofscreen, maxwidth, widthoftext} = this.calculateAmountOfHexThatCanFitOnScreen();
        const atcfolsosf = Math.floor(amountthatcanfitonleftsideofscreen);
        const bytesPerRow = Math.round(maxwidth/widthoftext);
        if(scrollDirection > 0) {
            const [readmem, offset] = ReadCheckedMemory(this.hProcess, this.addressBox.value+atcfolsosf-bytesPerRow, bytesPerRow);
            //if(offset) {
            //    this.memOffset += offset;
            //}else {
            //    this.memOffset -= bytesPerRow;
            //}
            const actuallyRead = bytesPerRow-offset;
            //ok im about to do something sketchy but im doing it in the name of SPEED
            //put all bytes except last [bytesPerRow] into this.memory + bytesPerRow
            memcpy(PointerFromArrayBuffer(this.memory), PointerFromArrayBuffer(this.memory)+bytesPerRow, atcfolsosf-bytesPerRow); //minus a row
            if(actuallyRead > 0) {
                print("actually read", actuallyRead);
                memcpy(PointerFromArrayBuffer(this.memory)+atcfolsosf-bytesPerRow, PointerFromArrayBuffer(readmem), bytesPerRow);
            }
        }else {
            const [readmem, offset] = ReadCheckedMemory(this.hProcess, this.addressBox.value, bytesPerRow);
            //if(offset) {
            //    this.memOffset += offset;
            //}else {
            //    this.memOffset -= bytesPerRow;
            //}
            const actuallyRead = bytesPerRow-offset;
            //ok im about to do something sketchy but im doing it in the name of SPEED
            memcpy(PointerFromArrayBuffer(this.memory)+bytesPerRow, PointerFromArrayBuffer(this.memory), atcfolsosf-bytesPerRow); //minus a row
            if(actuallyRead > 0) {
                print("actually read", actuallyRead);
                memcpy(PointerFromArrayBuffer(this.memory), PointerFromArrayBuffer(readmem), bytesPerRow);
            }
        }
    }

    readMemory() {
        const [memory, offset, offsetEnd, pageIndices] = ReadCheckedMemory(this.hProcess, this.children[0].value, Math.ceil(this.calculateAmountOfHexThatCanFitOnScreen().amountthatcanfitonleftsideofscreen));
        this.memory = memory;
        this.memOffset = offset;
        this.memOffsetEnd = offsetEnd;
        this.memPageIndices = pageIndices;
        dirty = true;
    }

    calculateAmountOfHexThatCanFitOnScreen() {
        const widthoftext = monofont.GetFontSize()+6; //18
        //const maxwidth = Math.floor(Math.floor(this.width/1.5)*widthoftext)/widthoftext; //400
        //print("maqxwidth:",maxwidth, " uh", Math.floor(this.width/1.5)*widthoftext, widthoftext);
        //OHHHHH to snap it's
        const maxwidth = Math.floor((this.width/1.5)/widthoftext)*widthoftext;
        //print(this.width, maxwidth);
        const actualheightminuscontrols = this.height-(this.children.length*18);
        const height = monofont.GetFontSize();
        const amountthatcanfitonleftsideofscreen = ((maxwidth)/(widthoftext))*(actualheightminuscontrols/height);
        return {amountthatcanfitonleftsideofscreen, widthoftext, maxwidth, height};
    }

    redraw() {
        //print("redraw");
        //this.addressBox.redraw(this.addressBox.x, this.addressBox.y);
        //this.windowBox.redraw(this.windowBox.x, this.windowBox.y);
        //this.nextPageButton.redraw(this.nextPageButton.x, this.nextPageButton.y);
        this.children.forEach(c=>c.redraw(c.x, c.y));
        //forAllArrays((c)=>c.redraw(), this.children, this.children_always_check);
        //this.forEach(c=>c.redraw());
        colorBrush.SetColor(255, 255, 255);
        const {amountthatcanfitonleftsideofscreen, widthoftext, maxwidth, height} = this.calculateAmountOfHexThatCanFitOnScreen();
        //print(amountthatcanfitonleftsideofscreen);
        for(let i = 0; i < amountthatcanfitonleftsideofscreen; i++) {
            const x = i*widthoftext;
            const left = (x)%maxwidth;
            const top = this.children.length*18+(Math.floor(x/maxwidth)*height);
            let hex = "??";
            let str = ".";
            if(i >= this.memOffset && i < amountthatcanfitonleftsideofscreen-this.memOffsetEnd) {
                const index = i-this.memOffset;
                hex = toHexPadded(this.memory[index]);
                if(this.memory[index] >= 32 && this.memory[index] <= 126) {
                    str = String.fromCharCode(this.memory[index]);
                }
            }
            //print(i, this.memory.length);
            d2d.DrawText(hex, monofont, left, top, left+20, top+20, colorBrush);
            //const littlewidth = Math.floor(this.width/widthoftext)*widthoftext;
            const littlex = x/3;
            //const littlemaxwidth = Math.floor((this.width-maxwidth)/widthoftext)*widthoftext;
            const littleleft = (littlex%(Math.floor(maxwidth/3*widthoftext)/widthoftext))+maxwidth; //(littlex%(Math.floor(this.width/widthoftext)*widthoftext-maxwidth))+(maxwidth);
            const littletop = top;//this.addressBox.height+(Math.floor(littlex/littlemaxwidth)*height);
            //d2d.DrawText(this.memory[i] >= 32 && this.memory[i] <= 126 ? String.fromCharCode(this.memory[i]) : ".", monofont, (((x/2)%(this.width-maxwidth))+(maxwidth)), top, (((x/2)%(this.width-maxwidth))+(maxwidth))+20, top+20, colorBrush);
            d2d.DrawText(str, monofont, littleleft, littletop, littleleft+20, littletop+20, colorBrush);
            if(this.memPageIndices[i]) {
                const mpix = (maxwidth/3)+maxwidth;
                const script = left/widthoftext;
                d2d.DrawText(`${/*this.memPageIndices[i].offset*/script} <- NEW PAGE`, monofont, mpix, top, this.width, this.height, colorBrush);
            }
        }
    }

    windowResized(oldw, oldh) {
        this.width = D2DWindow.singleton.width;
        this.height = D2DWindow.singleton.height;
        /*this.addressBox.width = this.width;
        this.windowBox.width = this.width;
        this.nextPageButton.width = this.width;*/
        
        //i was gonna have it weirdl ike this but i decided that it was a bad idea
        //this.children.forEach(c => {
        //    if(c instanceof HorizontalListBox) {
        //        c.resize(this.width, c.height);
        //    }else {
        //        c.width = this.width;
        //    }
        //});

        this.children.forEach(c=>c.resize(this.width, c.height));
        //this.forEach(c=>c.resize(this.width, c.height));
        this.readMemory();
    }

    wheel(wp) {
        //print(wp);
        const scrollY = -wp/120
        print(scrollY);
        const {widthoftext, maxwidth} = this.calculateAmountOfHexThatCanFitOnScreen();
        print(maxwidth/widthoftext);
        const bytesPerRow = Math.round(maxwidth/widthoftext);
        const addressBox = this.children[0];
        addressBox.value += bytesPerRow*scrollY;
        addressBox.updateText();
        //this.readPartialMemory(scrollY);
        this.readMemory();
        //dirty = true;
    }

    //hittest(mouse) {
    //    /*let ht = this.addressBox.hittest(mouse, this.addressBox.x, this.addressBox.y);
    //    if(ht) {
    //        return ht;
    //    }
    //    ht = this.windowBox.hittest(mouse, this.windowBox.x, this.windowBox.y);
    //    if(ht) {
    //        return ht;
    //    }
    //    ht = this.nextPageButton.hittest(mouse, this.nextPageButton.x, this.nextPageButton.y);
    //    if(ht) {
    //        return ht;
    //    }*/
    //    //for(const control of this.children) {
    //    //    let ht;
    //    //    if(ht = control.hittest(mouse, control.x, control.y)) {//assuming i write the position of each control
    //    //        return ht; //hell yeah
    //    //    }
    //    //}
    //    //return [WHEEL, this];
    //    super.hittest(mouse);
    //}

    //destroy() {
    //    //this.addressBox.destroy();
    //    for(const control of this.children) {
    //        control.destroy();
    //    }
    //}
}

function drawBackground() {
    colorBrush.SetColor(24/255, 24/255, 24/255);
    d2d.FillRectangle(0, 0, D2DWindow.singleton.width, D2DWindow.singleton.height, colorBrush);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        ({d2d, colorBrush, font, roundStrokeStyle} = D2DWindow.singleton.init(hwnd));
        monofont = d2d.CreateFont("Consolas", 12);
        //print(d2d, colorBrush, font);
        print(panes, EditControl);
        panes.push(new MemoryPane(hwnd));
    }else if(msg == WM_TIMER) {
        panes[0].readMemory();
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const winclass = CreateWindowClass("memoview"/*, init*/, windowProc); //loop is not required y'all (but her timing is getting better)
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
//winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);

void new D2DWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "memoview.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, drawBackground);
//CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "memoview.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);