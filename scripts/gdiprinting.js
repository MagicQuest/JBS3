//trolling time https://stackoverflow.com/questions/21533555/printing-in-win32
//lowkey i got so close to this working but now i can't get the actual printer to work lmao it says it's offline (ok i fixed the printer it's go time)
if(Msgbox("im not gonna lie this PROBABLY* might not work for you but if it does it's lowkey gonna print SOMETHING (using your default printer) so be prepared for that", "be warned...", MB_OKCANCEL) != IDOK) {
    quit;
}
const printers = EnumPrinters(PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS, NULL, 1);

print(printers);

//const brother = printers[2]; //my real printer;
//print(brother.pName);

let defaultprintername = GetDefaultPrinter();
print("Default Printer:", defaultprintername);

if(!defaultprintername) {
    print("GetDefaultPrinter failed!", g=GetLastError(), _com_error(g));
    defaultprintername = printers[Math.floor(Math.random()*printers.length)].pName;
    print(`falling back to random printer (${defaultprintername}) from enum printers LMAO`);
}

const hdl = OpenPrinter(defaultprintername);
print(hdl);
if(!hdl) {
    print("OpenPrinter failed!", g=GetLastError(), _com_error(g));
}

const printerDC = CreateDC("WINSPOOL", defaultprintername, NULL, NULL); //allegedly when specifying a device name the first parameter doesn't matter
print(printerDC);

if(processors = EnumPrintProcessors(NULL, NULL, 1)) {
    const pp = processors[0];
    print("print processor 0:",pp.pName);
    
    let datatypes = EnumPrintProcessorDatatypes(NULL, pp.pName, 1);
    if(datatypes) {
        print("datatypes:", datatypes);
    }else {
        print("EnumPrintProcessorDatatypes didn't work :(", "fein", g=GetLastError(), _com_error(g));
    }
}

//const docinfo = new DOCINFO("cumlord", __dirname+"/printnigga", NULL, NULL);

//print(docinfo);

const docinfo = new DOCINFO("my gdi doc!"); //it seems like it wouldn't work until you put the name of the document (first parameter of DOCINFO lpszDocName)

print(StartDoc(printerDC, docinfo)); //, docinfo);
print(StartPage(printerDC));

//ok yeah idk what's with this bitmap (maybe because it's monochrome) but it just doesn't come out right when i try to get the bits (but it draws fine when i select it into a memDC)
/*const troll = LoadImage(NULL, __dirname+"/troll.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE | LR_MONOCHROME | LR_CREATEDIBSECTION); //createdibsection so i can just SetDIBitsToDevice that shit 

const {bmWidth, bmHeight, bmBits} = GetObjectHBITMAP(troll);

//let bmWidth = 2;
//let bmHeight = 2;
//let bmBits = new Uint8Array([
//    //B, G, R, A
//    255, 0, 0, 255,
//    0, 255, 0, 255,
//    0, 0, 255, 255,
//    0, 0, 0, 255,
//]);

//lowkey just had to add the SetDIBitsToDevice function                                                   oh lol i forgot it was monochrome i had that shit set to 32
SetDIBitsToDevice(printerDC, 0, 0, bmWidth, bmHeight, 0, 0, bmWidth, bmHeight, bmBits, bmWidth, bmHeight, 1, BI_RGB); //little verbose these functions are lowkey (but you'd basically have to do the same thing if you wrote it in c++ (most of these parameters are actually for the BITMAPINFO struct))
SetDIBitsToDevice(GetDC(NULL), 0, 0, bmWidth, bmHeight, 0, 0, bmWidth, bmHeight, bmBits, bmWidth, bmHeight, 1, BI_RGB);*/

//SetDIBits(printerDC, );
//const console = GetConsoleWindow();
//const dc = GetDC(console);
//const client = GetClientRect(console);
////const window = GetWindowRect(console);
////print(client, window);
//
//BitBlt(printerDC, 0, 0, client.right, client.bottom, dc, 0, 0, SRCCOPY); //draw console onto printer dc (ok but why is it so small lmao)
////BitBlt(GetDC(NULL), 0, 0, client.right, client.bottom, dc, 0, 0, SRCCOPY);
////print(PrintWindow(GetConsoleWindow(), printerDC, NULL)); //oh ok i think PrintWindow doesn't work on the console because the window must process the WM_PRINT message (which i guess the console doesn't do)
//print(ReleaseDC(console, dc));

//ok wait instead of all that lets print a png (im not gonna include the ExtEscape functions to check for that functionality though because they work so weird i just can't be bothered)
//printer device contexts are the only device context that can print PNG and JPEG (if it's implemented)
const msnexample = require("fs").readBinary(__dirname+"/msnexample.png");
print(msnexample.byteLength, msnexample.length);

                             //*4 because it's really small (that's more like it)
StretchDIBits(printerDC, 0, 0, 507*4, 516*4, 0, 0, 506, 516, msnexample, 506, 516, 0, BI_PNG, SRCCOPY, msnexample.byteLength);
//SetDIBitsToDevice(printerDC, 0, 0, 507, 516, 0, 0, 0, 516, msnexample, 506, 516, 0, BI_PNG, msnexample.byteLength);

print(EndPage(printerDC));
print(EndDoc(printerDC));

print(DeleteDC(printerDC));
print(ClosePrinter(hdl));