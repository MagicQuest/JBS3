//lowkey i can't get this to work: https://stackoverflow.com/questions/8482059/how-to-compile-an-assembly-file-to-a-raw-binary-like-dos-com-format-with-gnu
//so im just gonna use relyze

long long coolvalue() { //lmao unrelated but i just learned that the max number of parameters a function can have is 256! (https://stackoverflow.com/questions/4582012/maximum-number-of-parameters-in-function-declaration)
    return 0x100000000; //movabs this value into rax because >32 bit (returning 64 bit integer so eax is too small (eax is 32, ax is lower 16 bits, al is LOBYTE of the 16, ah is HIBYTE of the 16))
}

int main() {
    return coolvalue();
}