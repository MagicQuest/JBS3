bits 64
default rel

segment .data
    ;mov rax, QWORD [msg] moves the first 8 bytes of msg into rax
    ;mov rax, msg moves the address of msg???? 
    msg db "Hello world! (mangophonkedits)", 0xd, 0xa, 0
    className db "mywndclassname", 0
    title db "mango", 0
    prntd db "%d"

segment .text
global main
extern ExitProcess
extern _CRT_INIT

;rcx is dest, rdx is length
;r8 is counter
memset:
    xor r8d, r8d ;hell eyahg
    loop:
        mov BYTE [rcx+r8], 0
        cmp rdx, r8
        inc r8
    jg loop
    ;int3
    ret

main:
    ;int3
    push    rbp
    mov     rbp, rsp
    sub     rsp, 32

    call    _CRT_INIT

    lea rcx, [msg] ;gets the address of msg and stores it in rcx
    int3
    mov rcx, QWORD [msg] ;dereferences msg and stores the first 8 bytes (since i'm using *r*cx) into rcx 
    int3
    mov rcx, msg ;wtf rcx now holds the pointer to msg but this time i'm using movabs and msg is written in the opcode as an immediate

    ;so i guess lea is better since it uses less bytes?

    ;lea     rcx, [msg]
    ;call    printf
;
    ;mov rcx, [msg]
    ;call    printf

    xor     eax, eax
    call    ExitProcess
