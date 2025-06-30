//hold on i should make a version of this that searches for floats (like if the bytes seem to match a float with the value of +1.0 or something like that)

//both snatched from scripts/d2dcontrols/memoview.js
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
function ReadableQuery(mbi) {
    return mbi.State != MEM_FREE && mbi.AllocationProtect != PAGE_NOACCESS && mbi.Protect > PAGE_NOACCESS && (mbi.Protect & PAGE_GUARD) != PAGE_GUARD && (mbi.Protect & PAGE_READWRITE) == PAGE_READWRITE;
}

let title;
let choices;
while(true) {
    title = getline("tpye the name of the window that you want to fuck with: ");
    choices = [];
    EnumWindows((hwnd) => {
        const wintitle = GetWindowText(hwnd);
        if(wintitle.includes(title)) {
            choices.push(hwnd);
        }
    });

    if(choices.length == 0) {
        print("we couldn't find that nigga");
    }else {
        break;
    }
}

let window;

if(choices.length == 1) {
    print(GetWindowText(choices[0]));
    window = choices[0];
}else {
    print("choose one of these windows: ");
    for(let i = 0; i < choices.length; i++) {
        print(`[${i}]: ${GetWindowText(choices[i])} (${choices[i]})`);
    }
    const index = Number(getline(""));
    window = choices[index];
}

if(window) {
    const process = hProcessFromHWND(window);
    while(!GetKey(VK_ESCAPE)) {
        const basembi = VirtualQueryEx(process, 0);
        let i = basembi.BaseAddress;
        let success = true;
        
        const pages = {};
        
        while (success) {
            const mbi = VirtualQueryEx(process, i);
            //print(i, mbi.RegionSize);
            
            success = mbi.RegionSize; //i think if there are no further pages, RegionSize is 0
            if(ReadableQuery(mbi)) {
                pages[i] = {size: mbi.RegionSize};
            }
            i+=mbi.RegionSize;
        }

        const pageaddr = Number(Object.keys(pages)[Math.floor(Math.random()*Object.keys(pages).length)]);
        const {size} = pages[pageaddr];
        const address = pageaddr+Math.floor(Math.random()*size);
        const val = ReadProcessMemory(process, address, 1)[0];
        if(val == 0 || val == 1) {
            print(pageaddr, size, address, val + " -> " + (+!val));
            //getline("paws.");
            if(!WriteProcessMemory(process, address, new Uint8Array([!val]))) {
                let g; getline("FUCK " + (g=GetLastError()) + " " + _com_error(g));
            }
            
            Sleep(100);
        }
    }
    //wait sho9uldn't i close process? (wait no i meant CloseHandle)
}else {
    print("kys");
}