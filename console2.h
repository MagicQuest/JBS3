#pragma once

void BindCrtHandlesToStdHandles(bool bindStdIn, bool bindStdOut, bool bindStdErr);

/*
//https://learn.microsoft.com/en-us/windows/console/creating-a-pseudoconsole-session
extern HANDLE outputReadSide, inputWriteSide;

HRESULT PrepareStartupInformation(HPCON hpc, STARTUPINFOEX* psi);

HRESULT SetUpPseudoConsole(COORD size);
*/

/*
//https://devblogs.microsoft.com/commandline/windows-command-line-introducing-the-windows-pseudo-console-conpty/
//https://github.com/microsoft/terminal/blob/main/samples/ConPTY/EchoCon/EchoCon/EchoCon.cpp
HRESULT CreatePseudoConsoleAndPipes(HPCON* phPC, HANDLE* phPipeIn, HANDLE* phPipeOut);

HRESULT InitializeStartupInfoAttachedToPseudoConsole(STARTUPINFOEX* pStartupInfo, HPCON hPC);
*/