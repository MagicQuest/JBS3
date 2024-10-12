//(lowkey i don't think this worked when i was on my windows 10 vm so maybe it's called something different idk)
const ts = FindWindow(NULL, "Task Switching"); //the alt+tab menu

print(ts);
print("hold alt+tab LO!")

const time = Date.now();

const pos = GetWindowRect(ts);

//uxtheme = DllLoad("UxTheme.dll");
//print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
//print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
//let result = uxtheme("SetWindowTheme", 3, [ts, NULL, NULL], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER);
//print(result); //aw nothing happened when i trie3d it
//uxtheme("__FREE");

while(!GetKey(VK_ESCAPE)) {
    //print(GetWindowText(GetForegroundWindow())); //when explorer crashes and the alt+tab menu switches back to windows 8 or whatever it doesn't have a name...
    const i = (Date.now()-time)/500;
    SetWindowPos(ts, NULL, pos.left, pos.top+Math.sin(i)*20, pos.right, pos.bottom, SWP_NOZORDER | SWP_NOSIZE);
    //print(FindWindow(NULL, "Task Switching"));
    Sleep(16);
}