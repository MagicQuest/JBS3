//trolling time https://stackoverflow.com/questions/21533555/printing-in-win32
//lowkey i got so close to this working but now i can't get the actual printer to work lmao it says it's offline
if(Msgbox("im not gonna lie this PROBABLY* might not work for you but if it does it's lowkey gonna print SOMETHING so be prepared for that", "be warned...", MB_OKCANCEL) != IDOK) {
    quit;
}
const printers = EnumPrinters(PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS, NULL, 1);

print(printers);

const brother = printers[2]; //le real printer;
print(brother.pName);

const hdl = OpenPrinter(brother.pName);
print(hdl);
if(!hdl) {
    print(g=GetLastError(), _com_error(g));
}

const printerDC = CreateDC("WINSPOOL", brother.pName, NULL, NULL); //allegedly when specifying a device name the first parameter doesn't matter
print(printerDC);

if(processors = EnumPrintProcessors(NULL, NULL, 1)) {
    const pp = processors[0];
    print(pp.pName);
    
    print(EnumPrintProcessorDatatypes(NULL, pp.pName, 1), "fien", g=GetLastError(), _com_error(g));
}

//const docinfo = new DOCINFO("cumlord", __dirname+"/printnigga", NULL, NULL);

//print(docinfo);

print(StartDoc(printerDC)); //, docinfo);
print(StartPage(printerDC));

print(PrintWindow(GetConsoleWindow(), printerDC, NULL));

print(EndPage(printerDC));
print(EndDoc(printerDC));

print(DeleteDC(printerDC));
print(ClosePrinter(hdl));