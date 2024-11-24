//unfortunately when i started making jbs i barely knew how to use v8 and for some reason if you run jbsblueprints.js for too long, javascript hits the heap limit and crashes so clearly im not doing something right
//lets start with a big loop with some random function

const max = 100000000;

let j = {n: 0};

__debugbreak();

{
    for(let i = 0; i < max; i++) {
        //do work
        //j++;
        //mt_incremento(j);
        //mt_makeobject(true); //yeah the object template method is like ~3x worse than normal
        print(mt_makeobject(false).x, i);
        //if(i == max-1 || i == 0) {
        //    __debugbreak(); //pause so i can take snapshot of heap in visual sturido
        //}
    }
}

__debugbreak();

print(j);