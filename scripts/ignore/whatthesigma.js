while(!GetKey(VK_ESCAPE)) {
    if(GetKeyDown(VK_MENU)) {
        print();
        let {x, y} = GetCursorPos();
        let window = WindowFromPoint(x, y);
        print(GetWindowText(window));
        let {left, top, right, bottom} = GetWindowRect(window);
        print(`x: ${left}, y: ${top},\nwidth: ${right-left}, height: ${bottom-top}`);
    }
    Sleep(16);
}