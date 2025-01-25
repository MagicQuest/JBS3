nasm -f win64 -o %1.obj %1.asm

SETLOCAL
SET allargs=%*
IF NOT DEFINED allargs echo no args provided&GOTO :EOF 
SET arg1=%1
CALL SET someargs=%%allargs:*%1=%%
ECHO allargs  %allargs%
ECHO arg1     %arg1%
ECHO someargs %someargs%

link %1.obj /subsystem:console /out:%1.exe legacy_stdio_definitions.lib msvcrt.lib kernel32.lib %someargs%