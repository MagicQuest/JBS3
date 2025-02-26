//idk i might have to give up on spawn again
//nah SPAWN SECOND WIND

print(Beep(50, 1000, true).then(e => {
    print("BEEP Finir", e); //this IS possible because i call beep on a different thread and then queue a microtask to resolve the promise
}));

/*function sigmacallback(e) {
    print("BEEP Finir", e);
}

print(Beep(50, 1000, sigmacallback));*/

g = true;

spawn(function() {
    Sleep(1000);
    print(`Hello World!`);
    g = false; //yeah nah idk if spawn is possible js is single threaded
});

print("global", g);

while(!GetKey(VK_ESCAPE)) {
    Sleep(32);
    PerformMicrotaskCheckpoint(); //yeah if i want that beep at the top to resolve while this loop is going i gotta call this boy
    //print("sleepy");
}