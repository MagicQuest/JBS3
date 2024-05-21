#pragma once

#include <comdef.h> //_com_error

#define SusIfFailed(x,y) if(FAILED(x)) {MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK);return false;}
#define ContIfFailed(x,y) if(FAILED(x)) {MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK);}
#define RetIfFailed(x,y) if(FAILED(x)) {MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK);return;}
#define ERRORMB(x, y) MessageBoxA(NULL, (std::string("[")+std::to_string(x)+"]"+y).c_str(), _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK)
#define SafeRelease(punk) if(punk != nullptr) punk->Release(); punk = nullptr