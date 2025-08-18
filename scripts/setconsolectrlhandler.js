//formerly ignore/microtasks.js

let globalthing = 0;

function doSomething() {
    print("ahh hello from my microtask :)");
}

function doSomethingOnCtrlC(ctrlType) { //oops forgot about that parameter
    if(ctrlType == CTRL_C_EVENT) {
        printNoHighlight("Ctrl+C");
    }else if(ctrlType == CTRL_BREAK_EVENT) {
        printNoHighlight("Ctrl+Break"); //when exactly does this happen lol (oh yeah lol there's an actual "break" key)
    }
    //somekindoferrorlol;
    print("high note", ++globalthing);
    //Msgbox("mustard", "kys", MB_OK);
    //print("aftererr");
    return true;
}

const id = SetConsoleCtrlHandler(doSomethingOnCtrlC, true);
print(id);
if(!id) {
    print("SetConsoleCtrlHandler failed!");
}

while(!GetKey(VK_ESCAPE)) { //video idea: you have to hold one key at all times or else your computer will turn off
    print("running do dah do dah");
    //isolate->EnqueueMicrotask();
    queueMicrotask(doSomething);
    Sleep(16);
}

print(SetConsoleCtrlHandler(id, false)); //returns 1 on success

//ohhh at the end of the script v8 automagically does a microtask checkpoint (which means i might have come up with a solution for addEventListener in PeggleScripting)
//https://stackoverflow.com/questions/77054089/need-detailed-explanation-on-event-loop-and-microtask-checkpoints