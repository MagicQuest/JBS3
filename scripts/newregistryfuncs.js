//https://www.reddit.com/r/PowerShell/comments/o7jk51/ive_went_and_found_the_registry_key_for_taskbar/
//https://github.com/ixi-your-face/Useful-Windows-11-Scripts/blob/main/Scripts/Functions/Set-TaskbarAlignment.ps1
//HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced

//Computer\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Class\{36fc9e60-c465-11cf-8056-444553540000}

Msgbox("just so you're aware, this MIGHT change your taskbar alignment if you're on windows 11", "teehee - (newregistryfuncs.js)", MB_OK | MB_ICONINFORMATION);

const key = RegOpenKeyEx(HKEY_CURRENT_USER, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", 0, KEY_ALL_ACCESS);

print(key);

//well now i gotta test these new registry shits

//const ERROR_NO_MORE_ITEMS = 259; //lol i haven\t defined these because there is so many

let result = 0;
let i = 0;

while(result == 0) { //0 is ERROR_SUCCESS
    const subkeyInfo = RegEnumKeyEx(key, i);
    //print(subkeyInfo, result, i);
    if(subkeyInfo.name) { //checking if the returned object has properties (if not, the function has returned an error codfe)
        print(subkeyInfo, i);
        i++;
    }else {
        result = subkeyInfo;
    }
}

result = 0;
i = 0;

const keyStats = RegQueryInfoKey(key); //oh this has a property for the number of values

print(keyStats);

if(typeof(keyStats) == "number") {
    print(`RegQueryInfoKey(key) failed for some reason: [ ${keyStats} ] (${_com_error(keyStats)})`);
}else {
    while(result == 0) {
        const keyValueInfo = RegEnumValue(key, i, keyStats.maxValueLen);
        if(keyValueInfo.name) {
            print(keyValueInfo, i);
            i++;
        }else {
            result = keyValueInfo;
        }
    }
    
    print(`RegEnumValue finished on ${i}, [ ${result} ] ${_com_error(result)}`);
}

const value = Math.round(Math.random());

print("new value", value);

                    //in this instance subKey could be TaskbarDeveloperSettings (i think) but there are no values in it
print("old value", RegGetValue(key, "", "TaskbarAl", RRF_RT_REG_DWORD, keyStats.maxValueLen)); //using keyStats.maxValueLen here because although i know the length of this type (TaskbarAl is a REG_DWORD and a dword is only 4 bytes) there might be a time where you don't know so just slapping this thang on in there makes it work for everyone

print(RegSetValueEx(key, "TaskbarAl", REG_DWORD, value));

print(RegCloseKey(key))