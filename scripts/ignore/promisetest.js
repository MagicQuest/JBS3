//bruh visual studio crashed when i was testing this one (oops i forgot resolve in the promise maybe that fucked it up)
//ACTUALLY THAT'S NOT WHAT HAPPENED! i was testing windowminer.js instead of this one and that's what crash vs!

//async function test() {
//    await new Promise(function(resolve, reject) {
//        print("async? basically spawn?");
//        Sleep(1000);
//        print("done!");
//
//        resolve();
//    }).then(function() {
//        print("haha urethra!")
//    });
//}
//
//test();

(async function() {
    await new Promise(function(resolve, reject) { //grrrrr they implement some special c++ shit for Promise with node js
        print("async? basically spawn?");
        Sleep(1000);
        print("done!");
        
        resolve();
    });
})();

print("walking around doing nothing lalala");
Sleep(500);
print("still walking (water)");
Sleep(500);
print("hello world!");