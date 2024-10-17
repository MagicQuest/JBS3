//when used on the task switching window one of its props is NonRudeHWND
const window = GetForegroundWindow();
print(GetWindowText(window));
EnumPropsEx(window, (key, value) => { //returns a key (string) and value (number)
    print(key, value);
});