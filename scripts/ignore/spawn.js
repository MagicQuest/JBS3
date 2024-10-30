//idk i might have to give up on spawn again

g = true;

spawn(function() {
    Sleep(1000);
    //print(`Hello World!`);
    g = false;
});

//print("global", g);

while(!GetKey(VK_ESCAPE)) {
    Sleep(32);
}