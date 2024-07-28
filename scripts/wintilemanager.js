let d2d, bruh, font;
const bounds = 512;
const res = 1600; //put to actually resolution and include every running process
const mw = 16000/res; //mem worth (16000 because i only have 16 gb of memory)
const wh = Math.round(Math.sqrt(res));
const space = Math.round(bounds/wh);

let modules = {};
let windows = {};
let lastApps = {};
let apps = {};

function findspaceforapp(path) {
    let cell, x, y;
    for(let i = 0; i < res; i++) {
        x = Math.floor(Math.random()*wh);
        y = Math.floor(Math.random()*wh);
        if(cells[x][y].appid == undefined) {
            cell = true;//[x, y];
            break;
        }
    }
    if(cell) {
        apps[path].center = [x, y];
        cells[x][y].appid = path; //nextcells or just cells we;ll see (nope brainblast it's cells because this function is called before any drawing/logic is done on the cells)
    }else {
        print("failed to make space for "+apps[path].name);
    }
}

function updateMemoryShits(pid) {//PrintProcessNameAndID(pid) { //https://learn.microsoft.com/en-us/windows/win32/psapi/enumerating-all-processes
    let name;// = "<unknown>";

    let handle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid);

    //print(handle);

    if(handle) {
        let [hMod, cbNeeded, success] = EnumProcessModules(handle);
        //print(hMod, cbNeeded, success);
        if(success) {
            //if(!modules[hMod]) {
            //    modules[hMod] = 1;
            name = GetModuleBaseName(handle, hMod);

                let app = false;
                for(let hwnd in windows) {
                    const window = windows[hwnd];
                    if(window.processID == pid) {
                        let rect = GetWindowRect(hwnd);
                        if(rect.left > -screenWidth && (rect.right-rect.left) > 8) { //i'm just picking off windows that are like 0px wide
                            //print(rect, pid);
                            app = true;
                        }
                        //if(!IsIconic(hwnd)) {// && IsWindowVisible(hwnd)) { //https://stackoverflow.com/questions/5174120/c-sharp-how-to-determine-if-hwnd-is-in-tray-icons
                        //}
                        break;
                    }
                }

                if(app) {
                    let path = GetModuleFileNameEx(handle, hMod);
                    //if(path.includes("JBS3") || path.includes("java")) {
                        if(!apps[path]) {
                            apps[path] = {memTotal: 0, color: [Math.random(), Math.random(), Math.random()], name};
                            if(Object.keys(lastApps).length > 0) { //if this function has already been called once lastApps should have members and if a new app is being added i gotta know
                                findspaceforapp(path);
                            }
                        }
                        let workingset = GetProcessMemoryInfo(handle).WorkingSetSize/(1024*1024);
                        //print("hMod: "+path, " "+workingset);
                        apps[path].memTotal += workingset; //{memTotal: workingset};
                        apps[path].fresh = true;
                    //}
                }
                //EnumWindows((hwnd) => {
                //    let {processID} = GetWindowThreadProcessId(hwnd);
//
                //});
            //}
        }
    }

    //print(`${name || "<unknown>"}  (PID: ${pid})`);

    //OOPS I FORGOT CLOSE HANDLE
    CloseHandle(handle);
}

let frame = 0;
let cells = [];
let nextcells = [];

function initiateimportantstufftogetmemoryusage() {
    windows = {};
    EnumWindows((hwnd) => {
        windows[hwnd] = GetWindowThreadProcessId(hwnd);
    });
    
    for(let path in apps) {
        apps[path].fresh = false;
        apps[path].memTotal = 0;
        //apps[path].cells = 0;
    }
    EnumProcesses(updateMemoryShits);
    let removedApps = {};
    for(let path in apps) {
        const app = apps[path];
        if(!app.fresh) {
            //must've closed the application ;)
            removedApps[path] = true;
        }else {
            if(app.memLeft != undefined) {
                if(app.name.includes("JBS3")) {
                    print(app.memLeft, app.memTotal, lastApps[path].memTotal, app.memTotal-lastApps[path].memTotal);
                }
                app.memLeft += app.memTotal-lastApps[path].memTotal;
            }else {
                print("New app found: "+app.name);
                app.memLeft = app.memTotal;
            }
            if(app.cells <= 0) {
                print("App "+app.name+" was swallowed ("+app.cells+")");
                findspaceforapp(path);
            }
        }
    }
    if(Object.keys(removedApps).length > 0) {
        for(let j = 0; j < wh; j++) {
            for(let i = 0; i < wh; i++) {
                if(removedApps[cells[i][j].appid]) { //oh this is sooo cheeky (why tf am i using the word cheeky and not gemus)
                    cells[i][j].appid = undefined;
                }
            }
        }
    }
    //for(let path in removedApps) {
    //    delete apps[removedApps]; //wait this doesn't cause a concurrent modification exception type problem?
    //}
    lastApps = {};
    for(let path in apps) {
        if(removedApps[path]) {
            delete apps[path];
        }else {
            lastApps[path] = {memTotal: apps[path].memTotal};
            apps[path].cells = 0;
        }
    }
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, NULL, 255, LWA_ALPHA);
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd, NULL);
        font = d2d.CreateFont("comic sans ms", 8);
        print(font);
        //print(d2d);
        bruh = d2d.CreateSolidColorBrush(0.0, 0.0, 0.0, 1.0);
        //EnumWindows((window) => {
        //    let title = GetWindowText(window);
        //    if(title != "" && !IsIconic(window)) {
        //        print(title);
        //    }
        //})
        /*EnumProcesses((pid) => {
            print(pid);
        });*/
        for(let i = 0; i < wh; i++) {
            cells.push([]);
            for(let j = 0; j < wh; j++) {
                cells[i][j] = {appid: undefined};
            }
        }
        initiateimportantstufftogetmemoryusage();
        nextcells = cells.map((cell) => cell.slice());

        for(let path in apps) {
            let x = Math.floor(Math.random()*wh);
            let y = Math.floor(Math.random()*wh);
            apps[path].center = [x, y];
            cells[x][y].appid = path;
            apps[path].cells = 1;
        }
        //print(apps);
        //for(const module of modules) {
        //    print(GetModuleFileName(module));
        //}
        SetTimer(hwnd, NULL, 250);
    }else if(msg == WM_TIMER) {
        print("tick...");
        initiateimportantstufftogetmemoryusage();
        //if(frame % 4 == 0) {
        //    recalcCenters();
        //}
        d2d.BeginDraw();
        d2d.Clear(0,0,0);
        for(let j = 0; j < wh; j++) {
            for(let i = 0; i < wh; i++) {
                const x = i*space;
                const y = j*space;
                const cell = cells[i][j];
                let color;
                if(cell.appid) {
                    const app = apps[cell.appid];
                    color = app.color;
                    app.cells++;
                    //bruh.SetColor(1.0, 1.0, 1.0);
                    //d2d.DrawText(apps[cell.appid].name, font, x, y-space, bounds, bounds, bruh);
                    let moves = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    if(app.memLeft > mw) {
                        for(let move of moves) {
                            let ii = Math.min(Math.max(i+move[0],0),wh-1);
                            let jj = Math.min(Math.max(j+move[1],0),wh-1);
                            //if(cells[ii][jj].appid == undefined && Math.floor(Math.random()*3) == 0) {
                            if(cells[ii][jj].appid != cell.appid && Math.floor(Math.random()*3) == 0) {
                                app.memLeft-=mw;
                                app.cells++;
                                const oldapp = cells[ii][jj].appid;
                                if(oldapp) {
                                    //print(cell.appid, oldapp, cells[ii][jj], nextcells[ii][jj]);
                                    apps[cells[ii][jj].appid].memLeft+=mw;
                                    apps[cells[ii][jj].appid].cells--;
                                }
                                nextcells[ii][jj].appid = cell.appid; //is nextcells a reference to cells???? what's going on here
                                break;
                            }
                        }
                        //if(cells[i+1][j].appid == undefined && Math.floor(Math.random()*3) == 0) {
                        //    app.memLeft-=mw;
                        //    nextcells[i+1][j].appid = cell.appid;
                        //}else if(cells[i][j+1].appid == undefined && Math.floor(Math.random()*3) == 0) {
                        //    app.memLeft-=mw;
                        //    nextcells[i][j+1].appid = cell.appid;
                        //}else if(cells[i-1][j].appid == undefined && Math.floor(Math.random()*3) == 0) {
                        //    app.memLeft-=mw;
                        //    nextcells[i-1][j].appid = cell.appid;
                        //}else if(cells[i][j-1].appid == undefined && Math.floor(Math.random()*3) == 0) {
                        //    app.memLeft-=mw;
                        //    nextcells[i][j-1].appid = cell.appid;
                        //}
                    }else if(app.memLeft < 0) {
                        for(let move of moves) {
                            let ii = Math.min(Math.max(i+move[0],0),wh-1);
                            let jj = Math.min(Math.max(j+move[1],0),wh-1);
                            if(cells[ii][jj].appid != cell.appid) {
                                if(Math.random() > .5) {
                                    nextcells[i][j].appid = undefined;
                                    app.memLeft += mw;
                                    app.cells--;
                                }
                                break;
                            }
                        }
                        //if(cells[i+1][j].appid != cell.appid || cells[i-1][j].appid != cell.appid || cells[i][j+1].appid != cell.appid || cells[i][j-1].appid != cell.appid) {
                        //    if(Math.random() > .5) {
                        //        nextcells[i][j].appid = undefined;
                        //        app.memLeft += mw;
                        //    }
                        //}
                    }
                }else {
                    color = [0.2, 0.2, 0.2];
                }
                bruh.SetColor(...color);
                d2d.FillRectangle(x, y, x+space, y+space, bruh);
                //bruh.SetColor(...color.map((w)=>w-.1));
                //d2d.DrawRectangle(x, y, x+space, y+space, bruh);
            }
        }
        bruh.SetColor(0.1,0.1,0.1);
        for(let x = 1; x < wh; x++) {
            d2d.DrawLine(x*space, 0, x*space, bounds, bruh);
        }
        for(let y = 1; y < wh; y++) {
            d2d.DrawLine(0, y*space, bounds, y*space, bruh);
        }
        bruh.SetColor(1.0, 1.0, 1.0);
        for(let path in apps) {
            const app = apps[path];
            d2d.DrawText(`${app.name} (${app.memTotal} MB)`, font, app.center[0]*space, app.center[1]*space, bounds, bounds, bruh);
        }
        cells = nextcells.map((cell) => cell.slice());
        d2d.EndDraw();
        frame++;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("wintilemanager", windowProc); //max classname length is 256 lol
wc.hCursor = LoadCursor(NULL, IDC_HAND);//LoadIcon(NULL, IDI_APPLICATION); //haha just learned that you can use icons instead
wc.hbrBackground = COLOR_WINDOW+1;

CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_OVERLAPPEDWINDOW, wc, "", WS_BORDER | WS_POPUP | WS_VISIBLE, screenWidth-bounds-32, 32, bounds, bounds, NULL, NULL, hInstance); //now the window is only as big as the faze logo (therefore lagging my computer less)
//"For best drawing performance by the layered window and any underlying windows, the layered window should be as small as possible. An application should also process the message and re-create its layered windows when the display's color depth changes" https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-updatelayeredwindow https://learn.microsoft.com/en-us/previous-versions/ms997507(v=msdn.10)?redirectedfrom=MSDN