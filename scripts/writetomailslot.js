//open mailslots.js first then writetomailslot.js

const path = `\\\\.\\mailslot\\jbs_sigmas`;

let hFile = CreateFile(path, GENERIC_WRITE, FILE_SHARE_READ, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL);
if(hFile == INVALID_HANDLE_VALUE) {
    print("fuck something went wrong", g=GetLastError(), _com_error(g));
    quit;
}

print(WriteFile(hFile, "MANGO"));

CloseHandle(hFile);

//i wrote WriteFile wrong and i had to test it lol
//let mangoFile = CreateFile(__dirname+"/mango.txt", GENERIC_WRITE, FILE_SHARE_READ, OPEN_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
//print(",mamgp",mangoFile);
//if(mangoFile == INVALID_HANDLE_VALUE) {
//    print("something went wrong nigga", g=GetLastError(), _com_error(g));
//}
////print(WriteFile(mangoFile, "sigma sigma on the wall..."), "worked?");
//print(WriteFile(mangoFile, 1), "worked?");
//print("anything happened?", g=GetLastError(), _com_error(g));
//print(CloseHandle(mangoFile), "close");