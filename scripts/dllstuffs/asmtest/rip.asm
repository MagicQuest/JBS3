;lol im using nasm now

bits 64
default rel

segment .data

segment .text

global main
extern ExitProcess
extern _CRT_INIT

main:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 32

    call    _CRT_INIT

    lea rax, [rip] ;aw this won't compile

    call    ExitProcess