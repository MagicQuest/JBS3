//THIS SCRIPT WILL BLUESCREEN YOUR COMPUTER!!!
//https://stackoverflow.com/questions/49207263/c-sharp-how-to-p-invoke-ntraiseharderror

let i = 10;
for(i; i > 0; i--) {
    const result = Msgbox(`this script WILL bluescreen your computer after ${i-1} more message boxes`, "close this shit bro", MB_OKCANCEL | MB_ICONERROR | MB_SYSTEMMODAL);
    if(result == IDCANCEL) {
        quit;
    }
}
if(i == 0) {
    //extra precautions
    //RtlAdjustPrivilege();
    print("buckle up...");
    print(RtlAdjustPrivilege(19, true, false));
    print(NtRaiseHardError(0xdeaddead, 0, 0, 0, 6));
}