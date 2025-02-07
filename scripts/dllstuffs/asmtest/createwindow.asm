;nasm -f win64 -o createwindow.obj createwindow.asm
;link createwindow.obj /subsystem:windows /out:createwindow.exe /DEBUG /MACHINE:X64 legacy_stdio_definitions.lib msvcrt.lib kernel32.lib user32.lib gdi32.lib

;happy to say that i've BASICALLY written the whole win32 classic standard window prolog from scratch (and it only took 2 days i thjink)
;despite glancing at this banger i've had open in another tab: https://www.davidgrantham.com/nasm-basicwindow64/
;i still had my fair share of random problems though like when i allocated the msg struct (for the event loop) on the stack and forgot to leave shadow space so it was overwriting the first 32 bytes of msg struct... (i couldn't interact with my window the entire time)

;also i've had this video saved to a random playlist for like a year: https://www.youtube.com/watch?v=Wz_xJPN7lAY
;rdseed sounds tuff

bits 64
default rel

    IDC_ARROW equ                       32512

    CW_USEDEFAULT equ                   0x80000000

    WS_EX_OVERLAPPEDWINDOW equ          768
    WS_OVERLAPPEDWINDOW equ             13565952
    WS_VISIBLE equ                      0x10000000

    WM_CREATE equ                       0x0001
    WM_DESTROY equ                      0x0002
    WM_QUIT equ                         0x0012
    WM_PAINT equ                        0x000F
    WM_TIMER equ                        0x0113

    HALFTONE equ                        4

    SRCCOPY equ                         0x00CC0020

    MSG_SIZE equ                        48 ;MSG struct size

    WINDOW_WIDTH equ                    1000
    WINDOW_HEIGHT equ                   500

    SM_CXSCREEN equ                     0
    SM_CYSCREEN equ                     1

    %define break                       nop


segment .data
    ;mov rax, QWORD [msg] moves the first 8 bytes of msg into rax
    ;mov rax, msg moves the address of msg???? 
    msg db "Hello world! (mangophonkedits)", 0xd, 0xa, 0
    className db "mywndclassname", 0
    title db "mango", 0
    helpmestr db "MESSAGW!~", 0xd, 0xa, 0xd, 0xa, 0
    singing db "whatthesigma hello from WM_CREATE", 0xd, 0xa, 0xd, 0xa, 0
    singing2 db "whatthesigma destoying the window from WM_DESTROY", 0xd, 0xa, 0xd, 0xa, 0
    ;prntd db "%d"
    
    ;WNDCLASSA is 72 bytes
    ;                style+padding,    lpfnWndProc,      cbClsExtra+cbWndExtra,    hInstance,            hIcon,             hCursor,         hbrBackground,      lpszMenuName,        lpszClassName
    ;windowclass dq 0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000 
    ;https://www.tortall.net/projects/yasm/manual/html/nasm-pseudop.html

    ;WNDCLASSEXA is 80
    ;              cbSize+style      , lpfnWndProc       , cbClsExtra+cbWndExtra,   hInstance    ,       hIcon        ,      hCursor      ,   hbrBackground   ,    lpszMenuName   ,  lpszClassName    ,    hIconSm
    windowclass dq 0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000, 0x0000000000000000 ,0x0000000000000000 ,0x0000000000000000 ,0x0000000000000000 ,0x0000000000000000 ,0x0000000000000000

segment .bss
    hInstance resb 8 ;reserve 8 bytes for hInstance (could've just done resq 1)
    screenWidth resb 4
    screenHeight resb 4

segment .text
global WinMain
;global fixmyfuckingwindownigga
;global windowProc
extern _CRT_INIT
;extern printf

extern GetSystemMetrics

;windows bangers from user32
;extern RegisterClassA
extern RegisterClassExA
extern LoadCursorA
extern LoadIconA
extern CreateWindowExA
extern GetMessageA
extern TranslateMessage
extern DispatchMessageA
extern OutputDebugStringA
extern SetTimer

extern GetDC
extern Rectangle
;extern BitBlt
;extern CreateCompatibleDC
;extern DeleteDC
extern SetStretchBltMode
extern StretchBlt
extern ReleaseDC

extern DefWindowProcA
extern PostQuitMessage

extern ExitProcess
;hwnd, msg, wp, lp
;rcx,  rdx, r8, r9
windowProc:
    ;int3
    ;oh shit i immediately tried calling printf without thinking about rsp's misalignment OR allocating shadow space lmao
    ;call    printf
    
    ;nvm who knows what OutputDebugStringA changes so we'll save the registers here


    ;to access these, we can use rbp+8 to get rcx (not just rbp since we push the old value of rbp)
    ;should i be doing it like this? https://stackoverflow.com/questions/37511492/x86-assembly-pass-parameter-to-a-function-through-stack
    ;ok this cool link does it this wa
    ;push r9
    ;push r8
    ;push rdx
    ;push rcx
    

    push rbp
    mov rbp, rsp
    sub rsp, 32 ;at least (and since i push rbp, rsp has been aligned)

    mov QWORD [rbp+16], rcx
    mov QWORD [rbp+24], rdx
    mov QWORD [rbp+32], r8
    mov QWORD [rbp+40], r9

    ;cmp rdx, WM_DESTROY ;jmp table later
    ;mov r10, rcx ;save rcx in the r10 register
    lea rcx, [helpmestr] 
    call OutputDebugStringA

    mov rdx, QWORD [rbp+24]

    cmp rdx, WM_CREATE
    je IF_CREATE
    jmp IF_CREATE_ELSE
    IF_CREATE:
        lea rcx, [singing] 
        call OutputDebugStringA

        ;int3

        mov rcx, QWORD [rbp+16]
        xor edx, edx
        ;movzx r8d, 16 ;since it's a UINT for uElapse (the third parameter of SetTimer) i want to try this weird mov out
        ;aw man movzx doesn't do immediate
        mov r8d, 16
        xor r9d, r9d
        call SetTimer

        jmp defwindowproc
    
    IF_CREATE_ELSE:
        cmp rdx, WM_TIMER
        je IF_TIMER
        jmp IF_TIMER_ELSE

    IF_TIMER:
        ;int3
        sub rsp, 16 ;so i can store the dc at rsp+32 and the screen's dc at rsp+40! (because i've totally exhausted the shadow space earlier)


        mov rcx, QWORD [rbp+16]
        call GetDC

        %define dc       RSP + 32
        %define screenDC RSP + 40

        mov QWORD [dc], rax ;immediately store the dc at rsp+32

        mov rcx, rax ;well since i don't call anything yet rax still holds the dc so i don't have to dereference anything yet
        mov rdx, HALFTONE
        call SetStretchBltMode ;SetStretchBltMode returns an int so by the time i call ReleaseDC rax will have been totally changed

        ;now we'll get the screen's dc (i put it here so i could use rax earlier lol)
        xor ecx, ecx ;GetDC(NULL)
        call GetDC
        mov QWORD [screenDC], rax ;rsp+40 now holds the screen's dc

        mov rcx, QWORD [dc] ;get
        xor edx, edx
        xor r8d, r8d
        mov r9, WINDOW_WIDTH
        ;now we gotta start pushing shit
        ;sub rsp, 56 ;7*8 (7 remaining parameters after the first 4)
        ;oh shit 56 not divisible by 16 dawg
        sub rsp, 56 ;7*8 + 16 so rsp remains on a 16 byte boundary

        mov DWORD [rsp+4*8], WINDOW_HEIGHT ;4*8 = 32 so we are above the shadow space
        ;mov QWORD [rsp+5*8], QWORD [screenDC]
        ;OH NO! i sub rsp by 56 so when i try to use screenDC i'm off by 56!!!!!
        ;mov r10, QWORD [screenDC+56] ;sadly r10 is gonna have to be our fallguy )lol()
        ;mov QWORD [rsp+5*8], r10
        
        ;oh wait a second bruh
        ;rax STILL holds the screenDC!
        ;i totally forgot!
        mov QWORD [rsp+5*8], rax

        mov DWORD [rsp+6*8], 0
        mov DWORD [rsp+7*8], 0
        lea r11, [screenWidth]
        ;movzx r10d, DWORD [r11]
        ;xor r10, r10
        ;wait wait im hearing talk of instructions that operate on 32 bit registers actually zero the top 32 bits of the 64 bit version?
        ;i thought it was just xor lol
        ;https://stackoverflow.com/questions/11177137/why-do-x86-64-instructions-on-32-bit-registers-zero-the-upper-part-of-the-full-6
        mov r10d, DWORD [r11]
        mov DWORD [rsp+8*8], r10d
        lea r10, [screenHeight]
        ;xor r11, r11
        ;movzx r11d, DWORD [r10]
        mov r11d, DWORD [r10]
        mov DWORD [rsp+9*8], r11d
        mov DWORD [rsp+10*8], SRCCOPY

        ;int3
        call StretchBlt ;damn it bruh bitblt has so many arguments

        ;OH NO AGAIN!
        ;I'VE ADDED +16 AND THEREFORE RSP+32 AND RSP+40 DON'T POINT TO DC AND SCREENDC!!!!!!
        ;i knew something was going wrong because my ENTIRE computer would start lagging if i left it on too long (and also task manager would start turning black which is a weird sign of something gdi related going wrong)
        add rsp, 56;+16 ;aw shit forgot + 16
        ;i was just dereferencing bullshit bruh

        mov rcx, QWORD [rbp+16]
        mov rdx, QWORD [dc]
        call ReleaseDC ;release our dc

        xor ecx, ecx
        mov rdx, QWORD [screenDC]
        call ReleaseDC ;release the screen's dc

        add rsp, 16 ;NOW we can add 16!!!

        jmp defwindowproc


    IF_TIMER_ELSE:
        cmp rdx, WM_DESTROY
        je IF_DESTROY
        jmp defwindowproc

    IF_DESTROY:
        lea rcx, [singing2] 
        call OutputDebugStringA

        xor ecx, ecx
        call PostQuitMessage
        xor eax, eax
        jmp catch
        ;ret
    
    defwindowproc:
        mov rcx, QWORD [rbp+16]
        mov rdx, QWORD [rbp+24]
        mov r8, QWORD [rbp+32]
        mov r9, QWORD [rbp+40]
        ;else uhhh defwindowproca
        call DefWindowProcA

    catch:
    add rsp, 32 ;+32 ;+32 since we pushed all those shits earlier
    pop rbp ;we're done here
    ret


;rcx is dest, edx is length
;ecx, eax is modified
ZeroMemory:
    ;xor r8d, r8d ;hell eyahg
    ;loop:
    ;    mov BYTE [rcx+r8], 0
    ;    cmp rdx, r8
    ;    inc r8
    ;jg loop
    ;;int3
    ;ret
    push rdi
    mov rdi, rcx ;rep uses rdi as the destination or something

    xor eax, eax ;rep stosb uses AL or something to set the bytes

    xor ecx, ecx
    mov ecx, edx ;rep uses ecx to count
    rep stosb ;yeah ok?

    pop rdi
    ret

fixmyfuckingwindownigga: ;https://www.reddit.com/r/asm/comments/1bff694/x64_calling_convention_and_shadow_space/
    ;shadow space for RegisterClassA
    break
    
    ;ok lol when i tried to make this function the first problem i kept having was coming from the fact that i initalized windowclass wrong and didn't even realize
    ;then after fiddling with that for like 30 minutes i totally forgot that i commented the prolog code to see if i could just omit it (you could not...)
    push rbp
    mov rbp, rsp
    sub rsp, 32

    ;mov rip, rax ;yep
    xor ecx, ecx ;NULL
    mov rdx, IDC_ARROW
    ;call LoadCursorA ;rax should now hold the handle to a cursor so slap that shit into le windowclass
    call LoadIconA ;lol

    lea rcx, [windowclass] ;load le pointer into rcx as it is the first integer parameter for RegisterClassA
    ;ZeroMemory doesn't change rax
    ;mov rdx, 72
    ;call ZeroMemory

    lea rdx, [className] ;address of classname
    ;push rdx ;dangerous because if RegisterClassA fails, we leave this scope with this shit pushed bad... (also it's misaligned now i think so fuck it)
    lea r8, [windowProc] ;address of window proc
    lea r9, [hInstance] ;address of hinstance
    mov r9, QWORD [r9] ;dereference to get hInstance value
    
    ;sub rsp, 8 ;realignment (wait shouldn't i push it after?)
    ;push r9
    ;ok lets move it to rsp+32
    ;sub rsp, 16 ;full realignment so i can push r9 above the shadow space
    ;mov QWORD [rsp+32], r9 ;+32 so i don't interfere with the shadow space i reserve for RegisterClassExA

    ;wait nevermind i could just use rbp because of the shadow space
    mov QWORD [rbp+16], r9 ;+16 because the original value of rbp and the return address are at [rbp] and [rbp+8]
    ;store r9 for later retrieval 
    

    mov DWORD [rcx], 80 ;set cbSize = 80
    mov QWORD [rcx + 1*8], r8  ;set lpfnWndProc
    mov QWORD [rcx + 3*8], r9  ;set hInstance
    mov QWORD [rcx + 5*8], rax ;set hCursor
    mov QWORD [rcx + 8*8], rdx ;set lpszClassName

    call RegisterClassExA

    ;cmp rax, 0
    test rax, rax ;quicker
    jle fuck

    ;ok lets make the window!

    ;oh brother this has like 50 parameters
    ;wait CreateWindowA doesn't exist?
    ;it's a wrapper for CreateWindowEx
    
    ;mov ecx, WS_EX_OVERLAPPEDWINDOW
    ;haha rdx already holds the pointer to the classname :) (actually wait registerclassa could be changing it FUCK)
    lea rdx, [className] ;address of classname
    ;mov rcx, rdx
    ;call printf
    xor ecx, ecx

    lea r8, [title]
    ;mov r10, r9 ;r9 was the hinstance value (ok i have GOT to stop assuming that these registers stay the same after a function call...)
    ;mov r10, QWORD [rsp+32] ;lol pushed r9 above the shadow space
    ;add rsp, 16 ;for realignment
    mov r10, QWORD [rbp+16] ;lol
    xor r9d, r9d
    mov r9d, WS_OVERLAPPEDWINDOW | WS_VISIBLE

    break

    ;ok well i guess since this function takes so many damn parameters im gonna allocate more space
    sub rsp, 64 ;8*8

    ;push 0 ;lpParam
    ;push r10 ;hInstance
    ;push 0 ;hMenu
    ;push 0 ;hwndParent
    ;push 500+43 ;height
    ;push 500+20 ;width
    ;push 500 ;y
    ;push 500 ;x
    ;FUCK the first 4 additional parameters were DWORDS!
    ;wait im still multiplying by 8 tho is that like a thing?

              ;set right above the shadow space
    mov DWORD [rsp+4*8], CW_USEDEFAULT ;x
    mov DWORD [rsp+5*8], CW_USEDEFAULT ;y
    mov DWORD [rsp+6*8], WINDOW_WIDTH+20 ;width
    mov DWORD [rsp+7*8], WINDOW_HEIGHT+43 ;height
    mov QWORD [rsp+8*8], 0 ;hwndParent
    mov QWORD [rsp+9*8], 0 ;hMenu
    mov QWORD [rsp+10*8], r10 ;hInstance
    ;mov QWORD [rsp+10*8], 0
    mov QWORD [rsp+11*8], 0 ;lpParam
    call CreateWindowExA

    break

    add rsp, 64+32     ;oops forgor that (plus 32 so i can just get all the way back since im allocating the msg struct on the stack im just gonna sub 32 after that allocation)

    ;cmp rax, 0
    test rax, rax
    jle fuck

    ;wait where the fuck is the message loop
    ;ok instead of just defining an object like i did with winclass i'll allocate it on the stack :) (wait lets see x64 msvc do it on godbolt.org)
    sub rsp, MSG_SIZE ;MSG struct is 48 bytes (there's 4 bytes of padding at the end and after the first property (HWND))
    
    mov rcx, rsp
    mov rdx, MSG_SIZE
    call ZeroMemory ;to initialize the message struct at rsp

    sub rsp, 32
    ;SUBBING RSP NOW FOR THE SHADOW SPACE!
    ;ANY FURTHER QUERIES ABOUT THE MSG STRUCT WOULD BE OFFSET BY 32 BYTES (so access the message property would be [rsp+40] now!!!)
    
    ;lets set MSG.message (the second property of MSG) to ~WM_QUIT
    mov DWORD [rsp+40], ~WM_QUIT ;DWORD THO BECAUSE THE MESSAGE PROPERTY IS A UINT 


    ;now lets do le while loop (hold oin lemme google to make sure im doing it right)
    eventloop:
        ;int3
        cmp DWORD [rsp+40], WM_QUIT
        je cleanupstackformsg ;lol

        ;for get message
        ;rcx is LPMSG
        ;rdx is HWND
        ;r8 is (UINT) wMsgFilterMin
        ;r9 is (UINT) wMsgFilterMax
        
        ;for some reason MSVC uses lea instead of mov and mov uses less bytes so idk why they do it
        ;mov rcx, rsp ;sadly ZeroMemory changes rcx so we gotta set it again lol
        ;oh shoot the msg struct is no longer directly at rsp (which was bad) so now i actually have to use lea (which i didn't think ever happened)
        lea rcx, [rsp+32] ;+32 because of the shadow space
        xor edx, edx
        xor r8d, r8d ;apparently this is really the best way to set a register to 0 (and MSVC will do it according to godbolt)
        xor r9d, r9d
        call GetMessageA ;get message returns bool so lets check eax (i assume)
        ;also lets check if i can get away with using rcx assuming GetMessage doesn't change it (ok according to godbolt you gotta keep setting rcx (for some reason they use lea though instead of mov))
        ;cmp ecx, 0 (wait hold on test is slightly faster than cmp 0)
        test eax, eax ;oops i wrote ecx here by accident
        je eventloop ;if GetMessage returns 0, restart the loop
        ;yeah no at this point rcx has already changed so we gotta do le mov again
        lea rcx, [rsp+32] ;+32 because of the shadow space
        call TranslateMessage
        lea rcx, [rsp+32] ;+32 because of the shadow space
        call DispatchMessageA
        jmp eventloop

    cleanupstackformsg:
        add rsp, MSG_SIZE
        jmp wegood

    fuck:
        int3
    
    wegood:

    add rsp, 32
    pop rbp

    ret


;hInstance, prevInstance, nCmdList, nCmdShow
;   rcx,        rdx,         r8,       r9   

WinMain:
    ;int3
    push    rbp
    mov     rbp, rsp
    sub     rsp, 32

    ;idgaf about prevInstance so we writing to rdx (oh wait i could just do rax instead nvm)
    lea rax, [hInstance]
    mov QWORD [rax], rcx

    ;mov rdx, rcx
    ;lea rcx, [prntd]
    ;call printf
    ;mov [hInstance], rcx
    call    _CRT_INIT

    ;mov rcx, SM_CXSCREEN
    xor ecx, ecx ;SM_CXSCREEN is 0 so smarte
    call GetSystemMetrics
    mov DWORD [screenWidth], eax ;since GetSystemMetrics returns an int
    
    mov ecx, SM_CYSCREEN ;rcx or movzx ecx? (nah you don't need movzx because apparently it already zeros the top 32 bits)
    call GetSystemMetrics
    mov DWORD [screenHeight], eax ;since GetSystemMetrics returns an int

    ;lea     rcx, [msg]
    ;call    printf

    ;rax shall hold a pointer to our window i guess lol (but the event loop got us so yk)
    call    fixmyfuckingwindownigga

    xor     eax, eax
    call    ExitProcess
