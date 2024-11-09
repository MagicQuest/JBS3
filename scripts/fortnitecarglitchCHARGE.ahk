SetKeyDelay(-1)

holding := false
charge := 0

While(true) {
    KeyIsDown := GetKeyState("CapsLock" , "P")
    if(KeyIsDown) {
        ;OutputDebug("cap")
        ;MsgBox("cap", "sigma")
        /*Loop(50) {
            ;Send("{Space}")
            SendInput("{Space}")
        }*/
       holding := true
       charge += .25    ;charge speed my nigga
    }else if(holding){
        holding := false
        Loop(Ceil(charge)) {
            SendInput("{Space}")
        }
        ;MsgBox(Ceil(charge), "mango")
        charge := 0
    }
    Sleep(16)
}