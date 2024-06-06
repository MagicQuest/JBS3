#pragma once

#include <comdef.h> //_com_error

//ok im not gonna lie im getting linker erros saying this shit is already defined and unfortunately i can't be bothered to actually find out why so im turning it into a macro
//char* errorlookup(const char* msg, DWORD error);

//alright fuck this shit it didn't even work for the error code i wanted it to bruh
//i was literally getting garbage errors and i had to delete all the *.obj files in x64/Release

//#define ERRHELP(msg, error) char* errorText = NULL; \
//DWORD result = FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_IGNORE_INSERTS, NULL, error, MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT), errorText, 0, NULL); \
//if (result) { \
//	MessageBoxA(NULL, msg, errorText, MB_OK | MB_SYSTEMMODAL); \
//	LocalFree(errorText); \
//} \
//else { \
//	MessageBoxA(NULL, msg, "Failed to FormatMessage (sorry man you're just gonna have to google the error code)", MB_OK | MB_SYSTEMMODAL); \
//}

#define SusIfFailed(x,y) if(FAILED(x)) {MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK | MB_SYSTEMMODAL);return false;}
#define ContIfFailed(x,y) if(FAILED(x)) {MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK);}
#define RetIfFailed(x,y) if(FAILED(x)) {MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK | MB_SYSTEMMODAL);return;}
#define ERRORMB(x, y) MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK | MB_SYSTEMMODAL)
//#define SusIfFailed(x,y) if(FAILED(x)) {ERRHELP((std::string("[")+std::to_string(x)+"]"+y).c_str(), GetLastError());return false;}
//#define ContIfFailed(x,y) if(FAILED(x)) {ERRHELP((std::string("[")+std::to_string(x)+"]"+y).c_str(), GetLastError());}
//#define RetIfFailed(x,y) if(FAILED(x)) {ERRHELP((std::string("[")+std::to_string(x)+"]"+y).c_str(), GetLastError());return;}
//#define ERRORMB(x, y) ERRHELP((std::string("[")+std::to_string(x)+"]"+y).c_str(), GetLastError())
#define SafeRelease(punk) if(punk != nullptr) punk->Release(); punk = nullptr