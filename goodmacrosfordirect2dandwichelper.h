#pragma once

#include <comdef.h> //_com_error

//ok im not gonna lie im getting linker erros saying this shit is already defined and unfortunately i can't be bothered to actually find out why so im turning it into a macro (im good at c++ now but im still not gonna fix it)
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
#define LITERAL(cstr) String::NewFromUtf8Literal(isolate, cstr)
#define CStringFI(e) *String::Utf8Value(isolate, e)
#define WStringFI(e) (const wchar_t*)*String::Value(isolate, e)
#define IntegerFI(e) e/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust()
#define FloatFI(e) e.As<Number>()->Value()

#define SusIfFailed(x,y) if(FAILED(x)) {MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK | MB_SYSTEMMODAL);return false;}
#define ContIfFailed(x,y) if(FAILED(x)) {MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK);}
#define RetIfFailed(x,y) if(FAILED(x)) {MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK | MB_SYSTEMMODAL);return;}
#define RetPrintIfFailed(x,y) if(FAILED(x)) { \
    HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE); \
	SetConsoleTextAttribute(console, 4); \
	std::cout << "[" << x << "] " << y << " " << _bstr_t(_com_error(GetLastError()).ErrorMessage()) << "\x07" << std::endl; \
	SetConsoleTextAttribute(console, 7); \
	return; \
}
#define PrintIfFailed(x,y) if(FAILED(x)) { \
    HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE); \
	SetConsoleTextAttribute(console, 4); \
	std::cout << "[" << x << "] " << y << " " << _bstr_t(_com_error(GetLastError()).ErrorMessage()) << "\x07" << std::endl; \
	SetConsoleTextAttribute(console, 7); \
}

#define ERRORMB(x, y) MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK | MB_SYSTEMMODAL)
//#define SusIfFailed(x,y) if(FAILED(x)) {ERRHELP((std::string("[")+std::to_string(x)+"]"+y).c_str(), GetLastError());return false;}
//#define ContIfFailed(x,y) if(FAILED(x)) {ERRHELP((std::string("[")+std::to_string(x)+"]"+y).c_str(), GetLastError());}
//#define RetIfFailed(x,y) if(FAILED(x)) {ERRHELP((std::string("[")+std::to_string(x)+"]"+y).c_str(), GetLastError());return;}
//#define ERRORMB(x, y) ERRHELP((std::string("[")+std::to_string(x)+"]"+y).c_str(), GetLastError())
#define SafeRelease(punk) if(punk != nullptr) punk->Release(); punk = nullptr