print(`"${__dirname+"\\WindowsTools.dll"}"`);
const WindowsTools = DllLoad(__dirname+"\\WindowsTools.dll"); //for some reason this didn't work on the school virtual computer? (oooh i think this might've been a debug build dll (aw shit i'm right this probably has special dependancies and that's why it dont work (ok i got a release build)))
//print(err = GetLastError(), _com_error(err));

print("oh yeah baby the dll probably loaded ", WindowsTools);

//print(WindowsTools("OFD", 1, ["NIGGERS"], [VAR_CSTRING], RETURN_STRING, false));
//print(WindowsTools("f_niggers", 1, [10.1], [VAR_FLOAT], 2));

let lastT = Date.now();

while(!GetKey(VK_ESCAPE)) {
    //print(1000/(Date.now()-lastT)); //real fps
    if(GetKey('T'.charAt(0))) {
        let shit = GetMousePos();
        print(shit.x, shit.y);
        WindowsTools("newWord", 3, [200.5, 200.5, "oops bruh there is some garbage shits happening hee"], [/*VAR_FLOAT, VAR_FLOAT*/VAR_INT, VAR_INT, VAR_CSTRING], RETURN_NUMBER); //newWord in WindowsTools take float, float, const char* (and returns void)
    }else if(GetKey('C'.charAt(0))) {
        WindowsTools("clearWords", 0, [], [], RETURN_NUMBER);
    }
    WindowsTools("drawToScreen", 0, [], [], RETURN_NUMBER);
    lastT = Date.now();
    Sleep(10);
}