print(`"${__dirname+"/WindowsTools.dll"}"`);
const WindowsTools = DllLoad(__dirname+"/WindowsTools.dll"); //for some reason this didn't work on the school virtual computer?
print(_com_error(GetLastError()));

print("oh yeah baby the dll probably loaded ", WindowsTools);

//print(WindowsTools("OFD", 1, ["NIGGERS"], [VAR_CSTRING], RETURN_STRING, false));
//print(WindowsTools("f_niggers", 1, [10.1], [VAR_FLOAT], 2));

let lastT = Date.now();

while(!GetKey(VK_ESCAPE)) {
    //print(1000/(Date.now()-lastT)); //real fps
    if(GetKey('T'.charAt(0))) {
        let shit = GetMousePos();
        print(shit.x, shit.y);
        WindowsTools("newWord", 3, [200.5, 200.5, "oops bruh there is some garbage shits happening hee"], [/*VAR_FLOAT, VAR_FLOAT*/VAR_INT, VAR_INT, VAR_CSTRING], RETURN_NUMBER, false); //newWord in WindowsTools take float, float, const char* (and returns void)
    }else if(GetKey('C'.charAt(0))) {
        WindowsTools("clearWords", 0, [], [], RETURN_NUMBER, false);
    }
    WindowsTools("drawToScreen", 0, [], [], RETURN_NUMBER, false);
    lastT = Date.now();
    Sleep(10);
}