const ts = FindWindow(NULL, "Task Switching"); //the alt+tab menu

print(ts);
print("hold alt+tab LO!")

const time = Date.now();

const pos = GetWindowRect(ts);

while(!GetKey(VK_ESCAPE)) {
    const i = (Date.now()-time)/500;
    SetWindowPos(ts, NULL, pos.left, pos.top+Math.sin(i)*20, pos.right, pos.bottom, SWP_NOZORDER | SWP_NOSIZE);
    //print(FindWindow(NULL, "Task Switching"));
    Sleep(16);
}