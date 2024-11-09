while(!GetKey(VK_ESCAPE)) {
    if(GetKeyDown(VK_CAPITAL)) {
        for(let i = 0; i < 50; i++) { //HOLY SHIT DON'T DO 200 (and 50 is still kinda high too)
            keybd_event(VK_SPACE, KEYEVENTF_EXTENDEDKEY);
            //for some reason i thought i HAD to space out the keyup event from when you hit the key but i don't think you do 
            Sleep(NULL); //A value of zero causes the thread to relinquish the remainder of its time slice to any other thread that is ready to run. If there are no other threads ready to run, the function returns immediately, and the thread continues execution.
            keybd_event(VK_SPACE, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP);
        }
    }
    Sleep(16);
}