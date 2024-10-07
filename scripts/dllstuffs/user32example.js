const user32 = DllLoad("user32.dll");
print(user32);
const hwnd = GetConsoleWindow();
print(hwnd, "HWND?!");
print(user32("SetWindowPos", 7, [hwnd, NULL, 0, 0, 512, 512, SWP_NOZORDER], [VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER));
print(_com_error(GetLastError()));
//print(user32("__FREE"), "FREE?"); //oops doesn't work because i don't return?
//print(user32("SetWindowPos", 7, [hwnd, NULL, 512, 512, 512, 512, SWP_NOZORDER], [VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER, false));