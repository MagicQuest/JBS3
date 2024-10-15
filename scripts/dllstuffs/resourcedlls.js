//const jbs = LoadLibraryEx("E:/Users/megal/source/repos/JBS3/x64/Release/JBS3.exe", LOAD_LIBRARY_AS_DATAFILE); //lol i was gonna do this but then i realized that hInstance is literally what this would be returning
//const data = new Uint8Array([..."IDI_ICON1".split("").map(e => e.charCodeAt(0)), 0x00]);
//data[data.length] = 0x00; //null terminator

//well now i made it so that you can use a Wstring now so i gotta change data
                        //lol this looks bad but i split and add \0 to each character then join them together ("I.D.I._.I.C.O.N.1.") then split again to turn each character into its charcode and add 2 zeros for the null terminator
const data = new Uint8Array([..."IDI_ICON1".split("").map(e => e+"\0").join("").split("").map(e => e.charCodeAt(0)), 0x00, 0x00]) //now that LoadIcon takes wchar_t i gotta add zeros because wchar is 2 bytes
print(data);
//0x49 0x00 0x44 0x00 0x49 0x00 0x5f 0x00 0x49 0x00 0x43 0x00 0x4f 0x00 0x4e 0x00 0x31 0x00 0x00 0x00
const jbsicon = LoadIcon(hInstance, PointerFromArrayBuffer(data));//"IDI_ICON1"); //OOPS my LoadIcon can't do strings (because i never realized that there was a reason for it) so i had to come up with this bullshit (which is pretty genius)
//const jbsicon = LoadIcon(hInstance, "IDI_ICON1"); //both of these work now

const screen = GetDC(NULL);

while(!GetKey(VK_ESCAPE)) {
    const mouse = GetCursorPos();
    DrawIcon(screen, mouse.x, mouse.y, jbsicon);
}

ReleaseDC(NULL, screen);