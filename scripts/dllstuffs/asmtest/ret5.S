	.file	"ret5.cpp"
	.intel_syntax noprefix
	.text
	.globl	_Z9coolvaluev
	.def	_Z9coolvaluev;	.scl	2;	.type	32;	.endef
	.seh_proc	_Z9coolvaluev
_Z9coolvaluev:
.LFB0:
	.seh_endprologue
	movabs	rax, 4294967296
	ret
	.seh_endproc
	.def	__main;	.scl	2;	.type	32;	.endef
	.globl	main
	.def	main;	.scl	2;	.type	32;	.endef
	.seh_proc	main
main:
.LFB1:
	push	rbp
	.seh_pushreg	rbp
	mov	rbp, rsp
	.seh_setframe	rbp, 0
	sub	rsp, 32
	.seh_stackalloc	32
	.seh_endprologue
	call	__main
	call	_Z9coolvaluev
	add	rsp, 32
	pop	rbp
	ret
	.seh_endproc
	.ident	"GCC: (x86_64-win32-seh-rev0, Built by MinGW-W64 project) 8.1.0"
