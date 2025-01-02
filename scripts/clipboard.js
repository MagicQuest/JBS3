//if you call OpenClipboard but pass NULL then call EmptyClipboard you can't call SetClipboardData as EmptyClipboard sets the clipboard's parent to NULL (according to msdn mynigga)

//you must call OpenClipboard before EnumClipboardFormats :(
const window = GetConsoleWindow();
let success = OpenClipboard(window);
print(success); //lol console window

let formats = {};
formats[CF_TEXT] = "CF_TEXT";
formats[CF_BITMAP] = "CF_BITMAP";
formats[CF_METAFILEPICT] = "CF_METAFILEPICT";
formats[CF_SYLK] = "CF_SYLK";
formats[CF_DIF] = "CF_DIF";
formats[CF_TIFF] = "CF_TIFF";
formats[CF_OEMTEXT] = "CF_OEMTEXT";
formats[CF_DIB] = "CF_DIB";
formats[CF_PALETTE] = "CF_PALETTE";
formats[CF_PENDATA] = "CF_PENDATA";
formats[CF_RIFF] = "CF_RIFF";
formats[CF_WAVE] = "CF_WAVE";
formats[CF_UNICODETEXT] = "CF_UNICODETEXT";
formats[CF_ENHMETAFILE] = "CF_ENHMETAFILE";
formats[CF_HDROP] = "CF_HDROP";
formats[CF_LOCALE] = "CF_LOCALE";
formats[CF_DIBV5] = "CF_DIBV5";
formats[CF_MAX] = "CF_MAX";
formats[CF_OWNERDISPLAY] = "CF_OWNERDISPLAY";
formats[CF_DSPTEXT] = "CF_DSPTEXT";
formats[CF_DSPBITMAP] = "CF_DSPBITMAP";
formats[CF_DSPMETAFILEPICT] = "CF_DSPMETAFILEPICT";
formats[CF_DSPENHMETAFILE] = "CF_DSPENHMETAFILE";
formats[CF_PRIVATEFIRST] = "CF_PRIVATEFIRST";
formats[CF_PRIVATELAST] = "CF_PRIVATELAST";
formats[CF_GDIOBJFIRST] = "CF_GDIOBJFIRST";
formats[CF_GDIOBJLAST] = "CF_GDIOBJLAST";

function GetFormatName(format) {
    let formatname = GetClipboardFormatName(format);
    if(!formatname) {
        formatname = formats[format];
    }
    return formatname;
}

if(success) {
    print(CountClipboardFormats(), "formats in the clipboard right now");
    let last = EnumClipboardFormats(NULL); //oh i think EnumClipboardFormats returns the current formats that are valid right now
    let formatname = GetFormatName(last);
    //print("enum clipboard formats", last, formatname);
    print(`Clipboard ${formatname ?? "Data"} (${last}):`, GetClipboardData(last));
    while(format = EnumClipboardFormats(last)) {
        let formatname = GetFormatName(format);
        //print("enum clipboard formats", format, formatname);
        print(`Clipboard ${formatname ?? "Data"}  (${format}):`, GetClipboardData(format));
        last = format;
    }

    //if(IsClipboardFormatAvailable(CF_TEXT)) {
    //    const text = GetClipboardData(CF_TEXT); //is CF_TEXT wchar_t or char? (CF_UNICODETEXT is a thing but im gonna print em) (the google says CF_TEXT is char*) https://learn.microsoft.com/en-us/windows/win32/dataxchg/standard-clipboard-formats
    //    print("Clipboard Text: ", text); //, StringFromPointer(handle));
    //}else {
    //    print("whatever is on the clipboard ain't text i'll tell you that");
    //    const currentformatidk = EnumClipboardFormats(NULL);
    //    print("enum clipboard formats", currentformatidk, GetClipboardFormatName(currentformatidk));
    //}

    success = CloseClipboard();
    print(success);
}else {
    print(`OpenClipboard failded for some reason (maybe because a window (${c=GetClipboardOwner()} - ${GetWindowText(c) }) already had it open)`, g=GetLastError(), _com_error(g));
}