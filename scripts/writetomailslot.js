//open mailslots.js first then writetomailslot.js

function error(...args) {
    const console = GetStdHandle(STD_OUTPUT_HANDLE);
    SetConsoleTextAttribute(console, 4);
    printNoHighlight(...args);
    SetConsoleTextAttribute(console, 7);
}

const path = `\\\\.\\mailslot\\jbs_sigmas`; //matches with the path in mailslots.js

let hFile = CreateFile(path, GENERIC_WRITE, FILE_SHARE_READ, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL);
if(hFile == INVALID_HANDLE_VALUE) {
    //print("fuck something went wrong", g=GetLastError(), _com_error(g));
    error(`CreateFile failed... [${g=GetLastError()}] (${_com_error(g)})`);
    error("(probably because you didn't open mailslots.js first!)");
    quit;
}

//print(WriteFile(hFile, "MANGO"));

print("start a line with $ to eval the following string (ex: $print('peepee'))")

while((line = getline(`Write a message for ${path}: `, 512)) && line != "") {
    //oops! garbage noise keeps coming out from mailslots.js because i don't send the string with a null terminator! (2 nulls since we're sending a wstring)
    //wait hold on i'll just change read file so i don't have to do this lol
    //ok read and write file can now both do wstring and cstrings and everything works fine :)
    if(WriteFile(hFile, line, false, NULL)) {
        print(line);
    }else {
        error(`WriteFile failed [${g=GetLastError()}] (${_com_error(g)})`); //for mailslots GetLastError 38 is probably because the mailslot has closed 
        error(`NTSTATUS (lowkey idk if this is useful because the code it returned was invalid LOL!): [${g=RtlGetLastNtStatus()}] (${_com_error(g)})`);
    }
}

if(!CloseHandle(hFile)) {
    error(`failed to CloseHandle(hFile) ? [${g=GetLastError()}] (${_com_error(g)})`);
}

//i wrote WriteFile wrong and i had to test it lol
//let mangoFile = CreateFile(__dirname+"/mango.txt", GENERIC_WRITE, FILE_SHARE_READ, OPEN_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
//print(",mamgp",mangoFile);
//if(mangoFile == INVALID_HANDLE_VALUE) {
//    print("something went wrong nigga", g=GetLastError(), _com_error(g));
//}
//print(WriteFile(mangoFile, "sigma sigma on the wall..."), "worked?");
////print(WriteFile(mangoFile, new Uint8Array([100, 101, 103, 0])), "worked?");
//print("anything happened?", g=GetLastError(), _com_error(g));
//print(CloseHandle(mangoFile), "close");