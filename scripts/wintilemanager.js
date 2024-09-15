//let dc;
//incoming transmission from noah: applications that get swallowed get TERMINATED!
const blurRGBA = eval(require("fs").read(__dirname+"/fastblur.js"));

let defaulticon = LoadIcon(NULL, IDI_QUESTION);
let d2d, wic, bruh, font, hoverfont;
let mouse = {x: 0, y: 0};
let shownames = false;
const bounds = 512;
const res = 32000; //put to actually resolution and include every running process
const mw = 16000/res; //mem worth (16000 because i only have 16 gb of memory)
const wh = Math.round(Math.sqrt(res));
const space = Math.round(bounds/wh);

//let modules = {};
let windows = {};
let lastApps = {};
let apps = {};
let newapp = 0;

let trans = false; //lol

let textnotificationshit = [];

const DANGEROUSMODE = false; //if you turn this bih on any apps swallowed will just be closed (3 puffs and im gone?)

function findspaceforapp(path, id = undefined) {
    let cell, x, y;
    for(let i = 0; i < res; i++) {
        x = Math.floor(Math.random()*wh);
        y = Math.floor(Math.random()*wh);
        if(cells[x][y].appid == id) {
            cell = true;//[x, y];
            break;
        }
    }
    if(cell) {
        apps[path].center = [x, y];
        cells[x][y].appid = path; //nextcells or just cells we;ll see (nope brainblast it's cells because this function is called before any drawing/logic is done on the cells)
    }else {
        //\033[0m
        //tried using printNoHighlight but it lowkey also didn't work
        //for some reason when i added printNoHighlight like the other day i didn't think to add the actual functions i used to color the text
        let console = GetStdHandle(STD_OUTPUT_HANDLE);
        SetConsoleTextAttribute(console, 4);
        printNoHighlight(/*"\x1b[31;1m*/`failed to ${!id ? "make space" : "recenter"} for `+apps[path].name);//+"\x1b[0m");
        printNoHighlight(/*"\x1b[96m*/"trying again...");//\x1b[0m");
        printNoHighlight("looking for id "+id);
        //let b = false; //oh shit labels are a thing like actually (i thought it was an old thing like goto or something that got removed a long time ago)
        b: for(let j = 0; j < wh; j++) {
            for(let i = 0; i < wh; i++) {
                if(cells[i][j].appid == id) {
                    cell = true;
                    SetConsoleTextAttribute(console, 7);
                    printNoHighlight("FOUND!");
                    //b = true;
                    break b;
                }
            }
            //if(b) {
                //break;
            //}
        }

        if(cell) {
            apps[path].center = [x, y];
            cells[x][y].appid = path;
        }else {
            printNoHighlight(/*"\x1b[31;1m*/"absolutely no space left for "+apps[path].name+" (apparently?)");//"\x1b[0m(apparently?)");
        }
        SetConsoleTextAttribute(console, 7);
    }
}

function get_component(color, index) //https://stackoverflow.com/questions/14557087/how-to-extract-a-dword-color-variable-into-its-parameters-decimal-type
{
    const shift = index * 8;
    const mask = 0xFF << shift;
    return (color & mask) >> shift;
}

//function xyz(x, y, w, h) {
//    return (w*y-1)+x;
//}

class Color3 { //that's fun... (roblox lua reference)
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    new(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    rgb() {
        return [this.r, this.g, this.b];
    }
    get magnitude() {
        return Math.sqrt(this.r**2 + this.g**2 + this.b**2);
    }
    set magnitude(value) {
        let old = this.magnitude;
        let ratio = value/old;
        this.r = Math.min(this.r*ratio, 1);
        this.g = Math.min(this.g*ratio, 1);
        this.b = Math.min(this.b*ratio, 1);
    }
}

function randomcolorandd2dbitmapfromHICON(icon) {
    let wicbmp = wic.CreateBitmapFromHICON(icon, wic.GUID_WICPixelFormat32bppPBGRA); //i thought this would give me transparency but maybe not (oh yeah ID2D1RenderTarget is premultiplied alpha but ID2D1DeviceContext and up is straight or whatever)
    //print(`icon: ${icon}  wic: `, wicbmp);
    //apps[path].d2dicon = d2d.CreateBitmapFromWicBitmap(wicbmp, true); //why ain't this working (bruh im mad)
    let dim = wicbmp.GetSize();
    let d2dicon = d2d.CreateBitmap(dim.width, dim.height);
    let pixels = wicbmp.GetPixels(wic);
    d2dicon.CopyFromMemory(0, 0, dim.width, dim.height, pixels);
    //[dim.width/2, dim.height/2]
    blurRGBA(pixels, dim.width, dim.height, 3); //blur because i wanted like an "average" of all the colors but since it;s "transparent" it just blurs to black so idgaf anymore and im just gonna keep this line anyways
    //let e = xyz(Math.floor(Math.random()*dim.width), Math.floor(Math.random()*dim.height), dim.width, dim.height);
    let rc = pixels[Math.floor(Math.random()*(dim.width*dim.height))];//(dim.width*dim.height)/2];
    //for(let i = 0; i < pixels.length; i++) {
    //    let pixel = pixels[i];
    //    print(pixel, get_component(pixel, 2), get_component(pixel, 1), get_component(pixel, 0), name, i);
    //}
    //print(e, pixels.length, rc, color);
    //apps[path].d2dicon = d2dicon;

    let trc = pixels[Math.floor(Math.random()*(dim.width*dim.height))];
    let tc3 = new Color3(get_component(trc, 2)/255, get_component(trc, 1)/255, get_component(trc, 0)/255);
    if(tc3.magnitude < (Math.sqrt(3)/2.0)) {
        //printNoHighlight(tc3.rgb());
        tc3.magnitude = 1.2;
        //printNoHighlight(tc3.rgb());
    }else {
        tc3.magnitude+=.2;
    }
    let textcolor = tc3.rgb();
    
    wicbmp.Release();
    DestroyIcon(icon);
    return {color: [get_component(rc, 2)/255, get_component(rc, 1)/255, get_component(rc, 0)/255], d2dicon/*, pixels*/, textcolor};
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

                //if(app) {
                    let path = GetModuleFileNameEx(handle, hMod);
                    //if(path.includes("JBS3")) {// || path.includes("java")) {
                        if(!apps[path]) {
                            let {icon, id} = ExtractAssociatedIcon(hInstance, path);
                            //print(`travago -> ${id} (${name})`);
                            let {color, d2dicon, textcolor/*, pixels*/} = randomcolorandd2dbitmapfromHICON(icon);
                            //quit;
                            //let trc = pixels[Math.floor(Math.random()*(dim.width*dim.height))];
                            //let textcolor = [get_component(trc, 2)/255, get_component(trc, 1)/255, get_component(trc, 0)/255];
                    
                            apps[path] = {memTotal: 0, color/*: [Math.random(), Math.random(), Math.random()]*/, d2dicon, name, textcolor};
                            //honestly it's crazy that this worked
                            //let dim = GetIconDimensions(icon);
                            ////hbm = CreateDIBSection(dc, CreateDIBitmapSimple(220, -183, 32), DIB_RGB_COLORS);
                            //let dib = CreateDIBSection(dc, CreateDIBitmapSimple(dim.width, -dim.height, 32, 1, 0), DIB_RGB_COLORS);
                            //const memDC = CreateCompatibleDC(dc);
                            //SelectObject(memDC, dib.bitmap);
                            //DrawIcon(memDC, 0, 0, icon);
                            //DeleteDC(memDC);
                            //
                            //let d2dicon = d2d.CreateBitmap(dim.width, dim.height);
                            //
                            //d2dicon.CopyFromMemory(0, 0, dim.width, dim.height, dib.GetBits());
                            //
                            //apps[path].d2dicon = d2dicon;
                            
                            if(Object.keys(lastApps).length > 0) { //if this function has already been called once lastApps should have members and if a new app is being added i gotta know
                                findspaceforapp(path);
                            }
                        }
                        let workingset = GetProcessMemoryInfo(handle).WorkingSetSize/(1024*1024);
                        //print("hMod: "+path, " "+workingset);
                        apps[path].memTotal += workingset; //{memTotal: workingset};
                        apps[path].fresh = true;
                    //}
                //}
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

let memoryusage = 1; //memory usage gotta be bigger than cellusage for the first tick because they calculations be fuckedup
let cellusage = 0;

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
    if(Object.keys(lastApps).length == 0) {
        //first run meaning we need to add the "Other" app
        let {color, d2dicon, textcolor/*, pixels*/} = randomcolorandd2dbitmapfromHICON(defaulticon);
        //let trc = pixels[Math.floor(Math.random()*(dim.width*dim.height))];
        //let textcolor = [get_component(trc, 2)/255, get_component(trc, 1)/255, get_component(trc, 0)/255];
                                                            //converting the percentage of how many cells should be used but aren't to the amount of cells that should be taken up to the corresponding size in MB so i can do the memLeft shit you feel me (type shit)
        //if memoryusage is 90% and cellusage is 72.5%
        //we subtract 90 - 72.5 -> 17.5% then divide that (.175) then multiply it by res (32000) to get 5600 (this is the amount of cells that make up 17.5 percent of the window) now we need to figure out how much memory each cell is worth (hey we've got a variable for that!)
        let memTotal = (((memoryusage-cellusage)/100)*res)*mw; //i mean that's probably right idk
        apps["Other"] = {name: "Other processes idk lol", color, d2dicon, memTotal, textcolor}; //can't add memLeft yet because uhhhh yk
    }else {
        let memTotal = (((memoryusage-cellusage)/100)*res)*mw;
        apps["Other"].memTotal = memTotal;
    }
    
    apps["Other"].fresh = true;
    
    let removedApps = {};
    for(let path in apps) {
        const app = apps[path];
        if(!app.fresh) {
            //must've closed the application ;)
            removedApps[path] = true;
            //DestroyIcon(app.icon);
        }else {
            if(app.memLeft != undefined) {
                //if(app.name.includes("JBS3")) {
                //    print(app.memLeft, app.memTotal, lastApps[path].memTotal, app.memTotal-lastApps[path].memTotal);
                //}
                app.memLeft += app.memTotal-lastApps[path].memTotal;
            }else {
                print("New app found: "+app.name);
                newapp = 99;
                textnotificationshit.push({t: 0, text: app.name, color: [Math.random(), Math.random(), Math.random()], x: Math.round(Math.random()*(bounds-200))});
                app.memLeft = app.memTotal;
            }
            if(app.cells <= 0) {
                print("App "+app.name+" was swallowed ("+app.cells+")");
                if(!DANGEROUSMODE) {
                    findspaceforapp(path);
                }else {
                    //🔫
                    //the lab boys at stackoverflow say an easy way to terminate a process is with good ol' system (plus i don't keep track of the hProcess shit)
                    print(system(`taskkill /F /T /IM ${app.name}`));
                }
            }
            if(app.center) {
                if(cells[app.center[0]][app.center[1]].appid != path) {
                    findspaceforapp(path, path);
                }
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

function dotransparency(hwnd,trans) {
    SetLayeredWindowAttributes(hwnd, NULL, trans ? 51 : 255, LWA_ALPHA);
    SetWindowLongPtr(hwnd, GWL_EXSTYLE, WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_OVERLAPPEDWINDOW | (trans ? WS_EX_TRANSPARENT : 0));
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, NULL, 255, LWA_ALPHA);
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd, NULL);
        //dc = GetDC(hwnd);
        wic = InitializeWIC(); ScopeGUIDs(wic);
        font = d2d.CreateFont("comic sans ms", 8);
        hoverfont = d2d.CreateFont("impact", 16);
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
            //print(apps[path].icon);
        }
        //print(apps);
        //for(const module of modules) {
        //    print(GetModuleFileName(module));
        //}
        SetTimer(hwnd, NULL, 32);
    }else if(msg == WM_TIMER) {
        //print("tick...");
        //let d = Date.now();
        initiateimportantstufftogetmemoryusage();
        //print(`took ${Date.now()-d}ms to update memory usage`); //apparently it normally only takes ~85ms (give or take like 15ms)
        //if(frame % 4 == 0) {
        //    recalcCenters();
        //}
        if(GetKeyDown(VK_TAB)) {
            trans = !trans;
            dotransparency(hwnd, trans);
        }
        if(newapp) { //do blinking effect when new app is added if the window was transparent
            //print(newapp, trans);
            if(newapp > 0) { //newapp's value when first set is 99
                if(trans) { //if the window is currently transparent then this will negate newapp's number (and this if statement will only fire the first time)
                    newapp = -newapp;
                }else { //if it wasn't transparent then idgaf
                    newapp = 0;
                }
            }else {
                //now that we know the window was transparent when newapp was set to 99 we can do the thing
                let s = -Math.round(newapp/33);
                if(s == 3) {
                    dotransparency(hwnd, false);
                }else if(s == 2) {
                    dotransparency(hwnd, false);
                }else if(s == 1) {
                    dotransparency(hwnd, true);
                }
                newapp+=9;
            }
            //if(newapp == 0) { //lawl (replace every l with r >:3)
                //newapp = 0;
            //}
        }
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
                    if(cell.appid == mouse?.path) color = color.map((w)=>w+.1);
                    app.cells++;
                    //bruh.SetColor(1.0, 1.0, 1.0);
                    //d2d.DrawText(apps[cell.appid].name, font, x, y-space, bounds, bounds, bruh);
                    const moves = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    if(app.memLeft > mw) {
                        for(let move of moves) {
                            let ii = Math.min(Math.max(i+move[0],0),wh-1);
                            let jj = Math.min(Math.max(j+move[1],0),wh-1);
                            //if(cells[ii][jj].appid == undefined && Math.floor(Math.random()*3) == 0) {
                            if(cells[ii][jj].appid != cell.appid && Math.floor(Math.random()*3) == 0 && nextcells[ii][jj].appid != cell.appid) {
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
                        let neighbors = 0;
                        for(let m = -1; m <= 1; m++) {
                            for(let n = -1; n <= 1; n++) {
                                let ii = Math.min(Math.max(i+m,0),wh-1);
                                let jj = Math.min(Math.max(j+n,0),wh-1);
                                if(cells[ii][jj].appid == cell.appid) {
                                    neighbors++;
                                }else if(cells[ii][jj].appid != undefined) {
                                    neighbors++;// += .5; //uh this didn't actually work the way i wanted it to so i might change the 'if' in the next for loop
                                }
                            }
                        }
                        for(let move of moves) {
                            let ii = Math.min(Math.max(i+move[0],0),wh-1);
                            let jj = Math.min(Math.max(j+move[1],0),wh-1);
                            if(cells[ii][jj].appid != cell.appid) {
                                if(Math.random() > neighbors/10) { //make it more likely to win the random if it's not near as many cells
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
            d2d.DrawLine(x*space, 0, x*space, bounds, bruh, 1);
        }
        for(let y = 1; y < wh; y++) {
            d2d.DrawLine(0, y*space, bounds, y*space, bruh, 1);
        }
        //use math to figure out what cell im hovering over and display info about it
        let totalCells = 0;
        let realTotal = 0;
        for(let path in apps) {
            const app = apps[path];
            const x = Math.min(app.center[0]*space, bounds-18);
            const y = Math.min(app.center[1]*space, bounds-18);
            if(shownames) {
                bruh.SetColor(0.0, 0.0, 0.0);
                d2d.DrawText(`${app.name} (${Math.round(app.memTotal*10)/10} MB)`, font, (x)+1, (y)+17, bounds, bounds, bruh);
                bruh.SetColor(...app.textcolor);
                d2d.DrawText(`${app.name} (${Math.round(app.memTotal*10)/10} MB)`, font, x, y+16, bounds, bounds, bruh);
            }
            d2d.DrawBitmap(app.d2dicon, x, y, x+16, y+16, 1.0); //<- how did this bullshit actually work -> https://www.youtube.com/watch?v=komb7TaF-6o
            if(path != "Other") {
                totalCells += app.cells;
            }
            realTotal += app.cells;
            //DrawIcon(dc, app.center[0]*space, app.center[1]*space, app.icon);
        }
        //print(`${Math.floor((totalCells/res)*1000)/10}% memory used according to the cells ${res} ${totalCells}`); //since this isn't equal to the actual memory used i might just make some fake app to take up the space
        if(Object.keys(mouse).length) {
            //print(mouse);
            let mx = Math.floor(mouse.x/space);
            let my = Math.floor(mouse.y/space);
            const app = apps[cells[mx][my].appid];
            mouse.path = cells[mx][my].appid;
            if(app) {
                //d2d.FillRectangle(mx, my, mx+space, my+space, bruh);
                bruh.SetColor(0.0, 0.0, 0.0);
                d2d.DrawText(`${app.name} (${Math.round(app.memTotal*10)/10} MB) (${app.memLeft} MB Left)`, hoverfont, (mx*space)+2, (my*space)+2, bounds, bounds, bruh);
                bruh.SetColor(Math.random(), Math.random(), Math.random());
                d2d.DrawText(`${app.name} (${Math.round(app.memTotal*10)/10} MB) (${app.memLeft} MB Left)`, hoverfont, mx*space, my*space, bounds, bounds, bruh);
            }
        }
        if(textnotificationshit.length) {
            let removed = [];
            for(let tnshit of textnotificationshit) {
                tnshit.t+=2;
                bruh.SetColor(0.0, 0.0, 0.0, 1-(tnshit.t)/100);
                d2d.DrawText(`New process: ${tnshit.text}`, hoverfont, tnshit.x, (bounds/1.5)-tnshit.t+2,bounds, bounds, bruh);
                bruh.SetColor(...tnshit.color, 1-(tnshit.t)/100);
                d2d.DrawText(`New process: ${tnshit.text}`, hoverfont, tnshit.x+2, (bounds/1.5)-tnshit.t,bounds, bounds, bruh);
                if(1-(tnshit.t)/100 < 0.0) {
                    //textnotificationshit = undefined;
                    removed.push(tnshit.text);
                }
            }
            for(let text of removed) {
                textnotificationshit.splice(textnotificationshit.findIndex((e) => e.text == text), 1); //oh yeah i did this number in TOUHOU.js
            }
        }
        let msex = GlobalMemoryStatusEx();
        //print(msex, (1-(msex.ullAvailPhys/msex.ullTotalPhys))*100);
        bruh.SetColor(1.0, 1.0, 1.0);
        memoryusage = Math.floor((1-(msex.ullAvailPhys/msex.ullTotalPhys))*100);
        cellusage = Math.floor((totalCells/res)*1000)/10;
        d2d.DrawText(`${memoryusage}% Memory`, hoverfont, 0, 0, bounds, bounds, bruh);
        d2d.DrawText(`${Math.floor((realTotal/res)*1000)/10}% Cells used`, hoverfont, 0, 16, bounds, bounds, bruh);
        d2d.DrawText(`${Math.floor(((realTotal-totalCells)/res)*1000)/10}% Cells taken up by Other`, hoverfont, 0, 32, bounds, bounds, bruh);
        cells = nextcells.map((cell) => cell.slice());
        d2d.EndDraw();
        frame++;
    }else if(msg == WM_MOUSEMOVE) {
        let {x, y} = MAKEPOINTS(lp);
        mouse.x = x;
        mouse.y = y;
    }else if(msg == WM_LBUTTONDOWN) {
        shownames = !shownames;
    }else if(msg == WM_MOUSELEAVE) {
        mouse = {};
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("wintilemanager", windowProc); //max classname length is 256 lol
wc.hCursor = LoadCursor(NULL, IDC_HAND);//LoadIcon(NULL, IDI_APPLICATION); //haha just learned that you can use icons instead
wc.hbrBackground = COLOR_WINDOW+1;

CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_OVERLAPPEDWINDOW, wc, "", /*WS_BORDER |*/ WS_POPUP | WS_VISIBLE, screenWidth-bounds-32, 32, bounds, bounds, NULL, NULL, hInstance); //now the window is only as big as the faze logo (therefore lagging my computer less)
//"For best drawing performance by the layered window and any underlying windows, the layered window should be as small as possible. An application should also process the message and re-create its layered windows when the display's color depth changes" https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-updatelayeredwindow https://learn.microsoft.com/en-us/previous-versions/ms997507(v=msdn.10)?redirectedfrom=MSDN