let globalthing = 0;

function doSomething() {
    print("ahh hello from my microtask :)");
}

function doSomethingOnCtrlC() {
    //somekindoferrorlol;
    print("high note", ++globalthing);
    //Msgbox("mustard", "kys", MB_OK);
    //print("aftererr");
    return true;
}

const id = SetConsoleCtrlHandler(doSomethingOnCtrlC, true);
print(id);

while(!GetKey(VK_ESCAPE)) { //video idea: you have to hold one key at all times or else your computer will turn off
    print("running do dah do dah");
    //isolate->EnqueueMicrotask();
    queueMicrotask(doSomething);
    Sleep(16);
}

//ohhh at the end of the script v8 automagically does a microtask checkpoint (which means i might have come up with a solution for addEventListener in PeggleScripting)
//https://stackoverflow.com/questions/77054089/need-detailed-explanation-on-event-loop-and-microtask-checkpoints