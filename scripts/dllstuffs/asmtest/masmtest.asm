_DATA SEGMENT

_DATA ENDS

_TEXT SEGMENT

int 3

;mov r8, 281B1D1h
;push r8 ;SKIBIDI

push 281B1D1h ; weirdly, the stack grows down. (haha lol not popping this makes rsp point to this value and when we hit ret it tries to execute 0x281B1D1)

;https://medium.com/@sruthk/cracking-assembly-stack-operations-63a279ae60d5
;https://medium.com/@sruthk/cracking-assembly-accessing-local-variables-in-x86-vs-x64-eb018ce1ef2a
;https://medium.com/@sruthk/cracking-assembly-stack-frame-layout-in-x64-75eb862dde08
;https://blog.holbertonschool.com/hack-virtual-memory-stack-registers-assembly-code/

mov eax, ecx
add eax, edx
ret

_TEXT ENDS

END