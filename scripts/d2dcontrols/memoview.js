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

function FindAllOccurrencesOfValueInVirtualMemory(process, value, string) { //wait this works way quicker than i expected B)
    const basembi = VirtualQueryEx(process, 0);
    if(string == 1) {
        value = value.split("").map(c=>c.charCodeAt(0));
    }else if(string == 2) {
        value = value.split("").map(e => e+"\0").join("").split("").map(e => e.charCodeAt(0));
    }
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
    const list = ["amd dvr overlay", "GDI+ Window", "DesktopWindowXamlSource", ".NET-BroadcastEventWindow", "GlobalHiddenWindow", "WUIconWindow", "MediaContextNotificationWindow", "SystemResourceNotifyWindow", "WISPTIS", "DDE Server Window", "Default IME", "MSCTFIME UI", "CiceroUIWndFrame", "HiddenWindow", "PopupHost"];
    for(let title of list) {
        if(t.includes(title)) {
            return false;
        }
    }
    return true;
}

class MemoryPane {
    x = 0;
    y = 0;
    width = w;
    height = h;

    //addressBox = undefined;
    //windowBox = undefined;
    //nextPageButton = undefined;
    childcontrols = [];
    memory = undefined;

    constructor(hwnd) {
        const addressBox = new EditControl(w, 18, undefined, GetModuleHandle(NULL), function(textbox) {
            //this.verifyInput();
            textbox.value = new Function(`return (${textbox.value})`)();
            print("looking around:",textbox.value);
            this.readMemory();
        }, this);
        const windowBox = new EditDropdownControl(w, 18, [], "memoview.js", function(windowBox) {
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
        const buttonList = new HorizontalListBox(w, 18, []);
        //width and height for the children of button list are 0 because they are initialized when addChild/resize is called
        const nextPageButton = new TextButtonControl(0, 0, "Skip to next page", [0.0, 0.0, 0.0], [.8, .8, .8], function(button, mouse) {
            const mbi = VirtualQueryEx(this.hProcess, addressBox.value);
            //const rs = mbi.RegionSize-(this.addressBox.value-mbi.BaseAddress);
            addressBox.value = mbi.BaseAddress+mbi.RegionSize; //this.addressBox.value+rs;
            this.readMemory();
        }, this);
        const nextRegionButton = new TextButtonControl(0, 0, "Skip through whole region", [0.0, 0.0, 0.0], [.8, .8, .8], function(button, mouse) {
            const mbi = VirtualQueryEx(this.hProcess, addressBox.value);
            addressBox.value = mbi.BaseAddress+GetFullSizeOfPageRegionAtAddress(this.hProcess, addressBox.value);
            this.readMemory();
        }, this);

        const checkboxLabelList = new HorizontalListBox(0, 0, []);
        const checkboxlabel = new StaticControl(0, 0, "constant:");
        const realtimeCheckbox = new CheckboxControl(0, 0, false, function(checkbox) {
            const randomtimerid = 21; //can't be 0 lol
            if(checkbox.value) {
                SetTimer(hwnd, randomtimerid, 100);
            }else {
                KillTimer(hwnd, randomtimerid);
            }
        }, this);
        checkboxLabelList.addChild(checkboxlabel);
        checkboxLabelList.addChild(realtimeCheckbox);

        //buttonList.list.push(nextPageButton);
        buttonList.addChild(nextPageButton);
        buttonList.addChild(nextRegionButton);
        buttonList.addChild(checkboxLabelList);

        const searchBox = new HorizontalListBox(w, 18, []);
        const searchEdit = new EditControl(0, 0, "string", "", undefined, undefined);
        const innerListBox = new HorizontalListBox(0, 0, []);
        const searchStringButton = new TextButtonControl(0, 0, "Search for string occurence", [0.0, 0.0, 0.0], [.8, .8, .8], function(button, mouse) {
            const addr = FindValueInWholeRegion(this.hProcess, addressBox.value, searchEdit.value, true);
            if(addr) {
                addressBox.value = addr;
                this.readMemory();
            }else {
                print("couldn't find",searchEdit.value);
            }
        }, this);
        const searchHexButton = new TextButtonControl(0, 0, "Search for hex occurence", [0.0, 0.0, 0.0], [.8, .8, .8], function(button, mouse) {
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
        
        innerListBox.addChild(searchStringButton);
        innerListBox.addChild(searchHexButton);
        searchBox.addChild(searchEdit);
        searchBox.addChild(innerListBox);

        //since i know where i want it im just gonna set the x and y myself
        addressBox.x = 0;
        addressBox.y = 0;
        windowBox.x = 0;
        windowBox.y = addressBox.height;
        //nextPageButton.x = 0;
        //nextPageButton.y = this.windowBox.y+this.windowBox.height;
        buttonList.x = 0;
        buttonList.y = windowBox.y+windowBox.height;
        searchBox.x = 0;
        searchBox.y = buttonList.y+buttonList.height;
        this.childcontrols.push(addressBox, windowBox, buttonList, searchBox);
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
        const [memory, offset, offsetEnd, pageIndices] = ReadCheckedMemory(this.hProcess, this.childcontrols[0].value, Math.ceil(this.calculateAmountOfHexThatCanFitOnScreen().amountthatcanfitonleftsideofscreen));
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
        const actualheightminuscontrols = this.height-(this.childcontrols.length*18);
        const height = monofont.GetFontSize();
        const amountthatcanfitonleftsideofscreen = ((maxwidth)/(widthoftext))*(actualheightminuscontrols/height);
        return {amountthatcanfitonleftsideofscreen, widthoftext, maxwidth, height};
    }

    redraw() {
        //print("redraw");
        //this.addressBox.redraw(this.addressBox.x, this.addressBox.y);
        //this.windowBox.redraw(this.windowBox.x, this.windowBox.y);
        //this.nextPageButton.redraw(this.nextPageButton.x, this.nextPageButton.y);
        this.childcontrols.forEach(c=>c.redraw(c.x, c.y));
        colorBrush.SetColor(255, 255, 255);
        const {amountthatcanfitonleftsideofscreen, widthoftext, maxwidth, height} = this.calculateAmountOfHexThatCanFitOnScreen();
        //print(amountthatcanfitonleftsideofscreen);
        for(let i = 0; i < amountthatcanfitonleftsideofscreen; i++) {
            const x = i*widthoftext;
            const left = (x)%maxwidth;
            const top = this.childcontrols.length*18+(Math.floor(x/maxwidth)*height);
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
        //this.childcontrols.forEach(c => {
        //    if(c instanceof HorizontalListBox) {
        //        c.resize(this.width, c.height);
        //    }else {
        //        c.width = this.width;
        //    }
        //});

        this.childcontrols.forEach(c=>c.resize(this.width, c.height));
        this.readMemory();
    }

    wheel(wp) {
        //print(wp);
        const scrollY = -wp/120
        print(scrollY);
        const {widthoftext, maxwidth} = this.calculateAmountOfHexThatCanFitOnScreen();
        print(maxwidth/widthoftext);
        const bytesPerRow = Math.round(maxwidth/widthoftext);
        const addressBox = this.childcontrols[0];
        addressBox.value += bytesPerRow*scrollY;
        addressBox.updateText();
        //this.readPartialMemory(scrollY);
        this.readMemory();
        //dirty = true;
    }

    hittest(mouse) {
        /*let ht = this.addressBox.hittest(mouse, this.addressBox.x, this.addressBox.y);
        if(ht) {
            return ht;
        }
        ht = this.windowBox.hittest(mouse, this.windowBox.x, this.windowBox.y);
        if(ht) {
            return ht;
        }
        ht = this.nextPageButton.hittest(mouse, this.nextPageButton.x, this.nextPageButton.y);
        if(ht) {
            return ht;
        }*/
        for(const control of this.childcontrols) {
            let ht;
            if(ht = control.hittest(mouse, control.x, control.y)) {//assuming i write the position of each control
                return ht; //hell yeah
            }
        }
        return [WHEEL, this];
    }

    destroy() {
        //this.addressBox.destroy();
        for(const control of this.childcontrols) {
            control.destroy();
        }
    }
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