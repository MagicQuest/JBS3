#include <windows.h>
#include <io.h>
#include <fcntl.h>
#include <iostream>
#include "console2.h"

void BindCrtHandlesToStdHandles(bool bindStdIn, bool bindStdOut, bool bindStdErr) //https://stackoverflow.com/questions/311955/redirecting-cout-to-a-console-in-windows/25927081#25927081
{
    // Re-initialize the C runtime "FILE" handles with clean handles bound to "nul". We do this because it has been
    // observed that the file number of our standard handle file objects can be assigned internally to a value of -2
    // when not bound to a valid target, which represents some kind of unknown internal invalid state. In this state our
    // call to "_dup2" fails, as it specifically tests to ensure that the target file number isn't equal to this value
    // before allowing the operation to continue. We can resolve this issue by first "re-opening" the target files to
    // use the "nul" device, which will place them into a valid state, after which we can redirect them to our target
    // using the "_dup2" function.
    if (bindStdIn)
    {
        FILE* dummyFile;
        freopen_s(&dummyFile, "nul", "r", stdin);
    }
    if (bindStdOut)
    {
        FILE* dummyFile;
        freopen_s(&dummyFile, "nul", "w", stdout);
    }
    if (bindStdErr)
    {
        FILE* dummyFile;
        freopen_s(&dummyFile, "nul", "w", stderr);
    }

    // Redirect unbuffered stdin from the current standard input handle
    if (bindStdIn)
    {
        HANDLE stdHandle = GetStdHandle(STD_INPUT_HANDLE);
        if (stdHandle != INVALID_HANDLE_VALUE)
        {
            int fileDescriptor = _open_osfhandle((intptr_t)stdHandle, _O_TEXT);
            if (fileDescriptor != -1)
            {
                FILE* file = _fdopen(fileDescriptor, "r");
                if (file != NULL)
                {
                    int dup2Result = _dup2(_fileno(file), _fileno(stdin));
                    if (dup2Result == 0)
                    {
                        setvbuf(stdin, NULL, _IONBF, 0);
                    }
                }
            }
        }
    }

    // Redirect unbuffered stdout to the current standard output handle
    if (bindStdOut)
    {
        HANDLE stdHandle = GetStdHandle(STD_OUTPUT_HANDLE);
        if (stdHandle != INVALID_HANDLE_VALUE)
        {
            int fileDescriptor = _open_osfhandle((intptr_t)stdHandle, _O_TEXT);
            if (fileDescriptor != -1)
            {
                FILE* file = _fdopen(fileDescriptor, "w");
                if (file != NULL)
                {
                    int dup2Result = _dup2(_fileno(file), _fileno(stdout));
                    if (dup2Result == 0)
                    {
                        setvbuf(stdout, NULL, _IONBF, 0);
                    }
                }
            }
        }
    }

    // Redirect unbuffered stderr to the current standard error handle
    if (bindStdErr)
    {
        HANDLE stdHandle = GetStdHandle(STD_ERROR_HANDLE);
        if (stdHandle != INVALID_HANDLE_VALUE)
        {
            int fileDescriptor = _open_osfhandle((intptr_t)stdHandle, _O_TEXT);
            if (fileDescriptor != -1)
            {
                FILE* file = _fdopen(fileDescriptor, "w");
                if (file != NULL)
                {
                    int dup2Result = _dup2(_fileno(file), _fileno(stderr));
                    if (dup2Result == 0)
                    {
                        setvbuf(stderr, NULL, _IONBF, 0);
                    }
                }
            }
        }
    }

    // Clear the error state for each of the C++ standard stream objects. We need to do this, as attempts to access the
    // standard streams before they refer to a valid target will cause the iostream objects to enter an error state. In
    // versions of Visual Studio after 2005, this seems to always occur during startup regardless of whether anything
    // has been read from or written to the targets or not.
    if (bindStdIn)
    {
        std::wcin.clear();
        std::cin.clear();
    }
    if (bindStdOut)
    {
        std::wcout.clear();
        std::cout.clear();
    }
    if (bindStdErr)
    {
        std::wcerr.clear();
        std::cerr.clear();
    }
}

//HANDLE outputReadSide, inputWriteSide;
//
////https://learn.microsoft.com/en-us/windows/console/creating-a-pseudoconsole-session
//HRESULT PrepareStartupInformation(HPCON hpc, STARTUPINFOEX* psi)
//{
//    // Prepare Startup Information structure
//    STARTUPINFOEX si;
//    ZeroMemory(&si, sizeof(si));
//    si.StartupInfo.cb = sizeof(STARTUPINFOEX);
//
//    // Discover the size required for the list
//    size_t bytesRequired;
//    InitializeProcThreadAttributeList(NULL, 1, 0, &bytesRequired);
//
//    // Allocate memory to represent the list
//    si.lpAttributeList = (PPROC_THREAD_ATTRIBUTE_LIST)HeapAlloc(GetProcessHeap(), 0, bytesRequired);
//    if (!si.lpAttributeList)
//    {
//        return E_OUTOFMEMORY;
//    }
//
//    // Initialize the list memory location
//    if (!InitializeProcThreadAttributeList(si.lpAttributeList, 1, 0, &bytesRequired))
//    {
//        HeapFree(GetProcessHeap(), 0, si.lpAttributeList);
//        return HRESULT_FROM_WIN32(GetLastError());
//    }
//
//    // Set the pseudoconsole information into the list
//    if (!UpdateProcThreadAttribute(si.lpAttributeList,
//        0,
//        PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE,
//        hpc,
//        sizeof(hpc),
//        NULL,
//        NULL))
//    {
//        HeapFree(GetProcessHeap(), 0, si.lpAttributeList);
//        return HRESULT_FROM_WIN32(GetLastError());
//    }
//
//    *psi = si;
//
//    return S_OK;
//}
//
//HRESULT SetUpPseudoConsole(COORD size)
//{
//    HRESULT hr = S_OK;
//
//    // Create communication channels
//
//    // - Close these after CreateProcess of child application with pseudoconsole object.
//    HANDLE inputReadSide, outputWriteSide;
//
//    // - Hold onto these and use them for communication with the child through the pseudoconsole.
//    //HANDLE outputReadSide, inputWriteSide;
//
//    if (!CreatePipe(&inputReadSide, &inputWriteSide, NULL, 0))
//    {
//        return HRESULT_FROM_WIN32(GetLastError());
//    }
//
//    if (!CreatePipe(&outputReadSide, &outputWriteSide, NULL, 0))
//    {
//        return HRESULT_FROM_WIN32(GetLastError());
//    }
//
//    HPCON hPC;
//    hr = CreatePseudoConsole(size, inputReadSide, outputWriteSide, 0, &hPC);
//    if (FAILED(hr))
//    {
//        return hr;
//    }
//
//    // ...
//
//    PCWSTR childApplication = L"C:\\windows\\system32\\cmd.exe";
//
//    // Create mutable text string for CreateProcessW command line string.
//    const size_t charsRequired = wcslen(childApplication) + 1; // +1 null terminator
//    PWSTR cmdLineMutable = (PWSTR)HeapAlloc(GetProcessHeap(), 0, sizeof(wchar_t) * charsRequired);
//
//    if (!cmdLineMutable)
//    {
//        return E_OUTOFMEMORY;
//    }
//
//    wcscpy_s(cmdLineMutable, charsRequired, childApplication);
//
//    PROCESS_INFORMATION pi;
//    ZeroMemory(&pi, sizeof(pi));
//
//    STARTUPINFOEX siEx{};
//    hr = PrepareStartupInformation(hPC, &siEx);
//
//    if (FAILED(hr)) {
//        return hr;
//    }
//
//    // Call CreateProcess
//    if (!CreateProcessW(NULL,
//        cmdLineMutable,
//        NULL,
//        NULL,
//        FALSE,
//        EXTENDED_STARTUPINFO_PRESENT,
//        NULL,
//        NULL,
//        &siEx.StartupInfo,
//        &pi))
//    {
//        HeapFree(GetProcessHeap(), 0, cmdLineMutable);
//        return HRESULT_FROM_WIN32(GetLastError());
//    }
//
//    CloseHandle(inputReadSide);
//    CloseHandle(outputWriteSide);
//
//    // ...
//}

/*
//https://devblogs.microsoft.com/commandline/windows-command-line-introducing-the-windows-pseudo-console-conpty/
//https://github.com/microsoft/terminal/blob/main/samples/ConPTY/EchoCon/EchoCon/EchoCon.cpp
HRESULT CreatePseudoConsoleAndPipes(HPCON* phPC, HANDLE* phPipeIn, HANDLE* phPipeOut)
{
    //HRESULT hr{ E_UNEXPECTED };
    HRESULT hr{ S_OK };
    HANDLE hPipePTYIn{ INVALID_HANDLE_VALUE };
    HANDLE hPipePTYOut{ INVALID_HANDLE_VALUE };

    // Create the pipes to which the ConPTY will connect
    if (CreatePipe(&hPipePTYIn, phPipeOut, NULL, 0) &&
        CreatePipe(phPipeIn, &hPipePTYOut, NULL, 0))
    {
        // Determine required size of Pseudo Console
        COORD consoleSize{128, 96};
        CONSOLE_SCREEN_BUFFER_INFO csbi{};
        HANDLE hConsole{ GetStdHandle(STD_OUTPUT_HANDLE) };
        if (GetConsoleScreenBufferInfo(hConsole, &csbi))
        {
            consoleSize.X = csbi.srWindow.Right - csbi.srWindow.Left + 1;
            consoleSize.Y = csbi.srWindow.Bottom - csbi.srWindow.Top + 1;
        }

        // Create the Pseudo Console of the required size, attached to the PTY-end of the pipes
        hr = CreatePseudoConsole(consoleSize, hPipePTYIn, hPipePTYOut, 0, phPC);

        // Note: We can close the handles to the PTY-end of the pipes here
        // because the handles are dup'ed into the ConHost and will be released
        // when the ConPTY is destroyed.
        if (INVALID_HANDLE_VALUE != hPipePTYOut) CloseHandle(hPipePTYOut);
        if (INVALID_HANDLE_VALUE != hPipePTYIn) CloseHandle(hPipePTYIn);
    }

    return hr;
}

// Initializes the specified startup info struct with the required properties and
// updates its thread attribute list with the specified ConPTY handle
HRESULT InitializeStartupInfoAttachedToPseudoConsole(STARTUPINFOEX* pStartupInfo, HPCON hPC)
{
    HRESULT hr{ E_UNEXPECTED };

    if (pStartupInfo)
    {
        size_t attrListSize{};

        pStartupInfo->StartupInfo.cb = sizeof(STARTUPINFOEX);

        // Get the size of the thread attribute list.
        InitializeProcThreadAttributeList(NULL, 1, 0, &attrListSize);

        // Allocate a thread attribute list of the correct size
        pStartupInfo->lpAttributeList =
            reinterpret_cast<LPPROC_THREAD_ATTRIBUTE_LIST>(malloc(attrListSize));

        // Initialize thread attribute list
        if (pStartupInfo->lpAttributeList
            && InitializeProcThreadAttributeList(pStartupInfo->lpAttributeList, 1, 0, &attrListSize))
        {
            // Set Pseudo Console attribute
            hr = UpdateProcThreadAttribute(
                pStartupInfo->lpAttributeList,
                0,
                PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE,
                hPC,
                sizeof(HPCON),
                NULL,
                NULL)
                ? S_OK
                : HRESULT_FROM_WIN32(GetLastError());
        }
        else
        {
            hr = HRESULT_FROM_WIN32(GetLastError());
        }
    }
    return hr;
}
*/