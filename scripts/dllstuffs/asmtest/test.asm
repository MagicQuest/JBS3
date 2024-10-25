	.file	"test.cpp"
	.intel_syntax noprefix
	.text
	.globl	_Z11awesomefuncv
	.def	_Z11awesomefuncv;	.scl	2;	.type	32;	.endef
	.seh_proc	_Z11awesomefuncv
_Z11awesomefuncv:
.LFB0:
	push	rbp
	.seh_pushreg	rbp
	mov	rbp, rsp
	.seh_setframe	rbp, 0
	sub	rsp, 16
	.seh_stackalloc	16
	.seh_endprologue
	mov	DWORD PTR -4[rbp], 5
	mov	eax, DWORD PTR -4[rbp]
	add	rsp, 16
	pop	rbp
	ret
	.seh_endproc
	.globl	_Z6__mainv
	.def	_Z6__mainv;	.scl	2;	.type	32;	.endef
	.seh_proc	_Z6__mainv
_Z6__mainv:
.LFB1:
	push	rbp
	.seh_pushreg	rbp
	mov	rbp, rsp
	.seh_setframe	rbp, 0
	sub	rsp, 32
	.seh_stackalloc	32
	.seh_endprologue
	call	_Z11awesomefuncv
	add	rsp, 32
	pop	rbp
	ret
	.seh_endproc
	.ident	"GCC: (x86_64-win32-seh-rev0, Built by MinGW-W64 project) 8.1.0"
