#Requires AutoHotkey v2.0

SetKeyDelay 0
DetectHiddenWindows true
SetTitleMatchMode 2

Loop
{
    ;ControlSend RenderWindow1, {d down}, LDPlayer
    ControlSend "{d down}",, "Roblox"
    sleep 745
    ControlSend "{d up}",, "Roblox"
    ;ControlSend RenderWindow1, {d up}, LDPlayer
    sleep 643
}
return
