globalThis.GetExportedFunctions = (function() {
    eval(require("fs").read(__dirname+"/marshallib.js"));

    const IMAGE_NUMBEROF_DIRECTORY_ENTRIES = 16;

    const IMAGE_DIRECTORY_ENTRY_EXPORT =          0   // Export Directory
    const IMAGE_DIRECTORY_ENTRY_IMPORT =          1   // Import Directory
    const IMAGE_DIRECTORY_ENTRY_RESOURCE =        2   // Resource Directory
    const IMAGE_DIRECTORY_ENTRY_EXCEPTION =       3   // Exception Directory
    const IMAGE_DIRECTORY_ENTRY_SECURITY =        4   // Security Directory
    const IMAGE_DIRECTORY_ENTRY_BASERELOC =       5   // Base Relocation Table
    const IMAGE_DIRECTORY_ENTRY_DEBUG =           6   // Debug Directory
    const IMAGE_DIRECTORY_ENTRY_COPYRIGHT =       7   // (X86 usage)
    const IMAGE_DIRECTORY_ENTRY_ARCHITECTURE =    7   // Architecture Specific Data
    const IMAGE_DIRECTORY_ENTRY_GLOBALPTR =       8   // RVA of GP
    const IMAGE_DIRECTORY_ENTRY_TLS =             9   // TLS Directory
    const IMAGE_DIRECTORY_ENTRY_LOAD_CONFIG =    10   // Load Configuration Directory
    const IMAGE_DIRECTORY_ENTRY_BOUND_IMPORT =   11   // Bound Import Directory in headers
    const IMAGE_DIRECTORY_ENTRY_IAT =            12   // Import Address Table
    const IMAGE_DIRECTORY_ENTRY_DELAY_IMPORT =   13   // Delay Load Import Descriptors
    const IMAGE_DIRECTORY_ENTRY_COM_DESCRIPTOR = 14   // COM Runtime descriptor

    class IMAGE_DOS_HEADER extends memoobjectidk {
        static types = {
            e_magic: "WORD",
            e_cblp: "WORD",
            e_cp: "WORD",
            e_crlc: "WORD",
            e_cparhdr: "WORD",
            e_minalloc: "WORD",
            e_maxalloc: "WORD",
            e_ss: "WORD",
            e_sp: "WORD",
            e_csum: "WORD",
            e_ip: "WORD",
            e_cs: "WORD",
            e_lfarlc: "WORD",
            e_ovno: "WORD",
            e_res: "WORD", //[4]
            e_oemid: "WORD",
            e_oeminfo: "WORD",
            e_res2: "WORD", //[10]
            e_lfanew: "LONG",
        }
        static arrayLengths = {
            e_res: 4,
            e_res2: 10,
        }
        constructor(data, ...vargs) { //data must be a Uint8Array
            super(data, ...vargs);
        }
    }

    class IMAGE_FILE_HEADER extends memoobjectidk {
        static types = {
            Machine: "WORD",
            NumberOfSections: "WORD",
            TimeDateStamp: "DWORD",
            PointerToSymbolTable: "DWORD",
            NumberOfSymbols: "DWORD",
            SizeOfOptionalHeader: "WORD",
            Characteristics: "WORD",
        };
        constructor(data, ...vargs) { //data must be a Uint8Array
            super(data, ...vargs);
        }
    }

    class IMAGE_DATA_DIRECTORY extends memoobjectidk {
        static types = {
            VirtualAddress: "DWORD",
            Size: "DWORD",
        }
        constructor(data, ...vargs) { //data must be a Uint8Array
            super(data, ...vargs);
        }
    }

    class IMAGE_OPTIONAL_HEADER64 extends memoobjectidk {
        static types = {
            Magic: "WORD",
            MajorLinkerVersion: "BYTE",
            MinorLinkerVersion: "BYTE",
            SizeOfCode: "DWORD",
            SizeOfInitializedData: "DWORD",
            SizeOfUninitializedData: "DWORD",
            AddressOfEntryPoint: "DWORD",
            BaseOfCode: "DWORD",
            ImageBase: "ULONGLONG",
            SectionAlignment: "DWORD",
            FileAlignment: "DWORD",
            MajorOperatingSystemVersion: "WORD",
            MinorOperatingSystemVersion: "WORD",
            MajorImageVersion: "WORD",
            MinorImageVersion: "WORD",
            MajorSubsystemVersion: "WORD",
            MinorSubsystemVersion: "WORD",
            Win32VersionValue: "DWORD",
            SizeOfImage: "DWORD",
            SizeOfHeaders: "DWORD",
            CheckSum: "DWORD",
            Subsystem: "WORD",
            DllCharacteristics: "WORD",
            SizeOfStackReserve: "ULONGLONG",
            SizeOfStackCommit: "ULONGLONG",
            SizeOfHeapReserve: "ULONGLONG",
            SizeOfHeapCommit: "ULONGLONG",
            LoaderFlags: "DWORD",
            NumberOfRvaAndSizes: "DWORD",
            DataDirectory: IMAGE_DATA_DIRECTORY,
            //DataDirectory0: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory1: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory2: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory3: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory4: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory5: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory6: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory7: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory8: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory9: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory10: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory11: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory12: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory13: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory14: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
            //DataDirectory15: IMAGE_DATA_DIRECTORY, //[IMAGE_NUMBEROF_DIRECTORY_ENTRIES] (not sure how i'll do arrays)
        }
        static arrayLengths = {
            DataDirectory: IMAGE_NUMBEROF_DIRECTORY_ENTRIES,
        }
        constructor(data, ...vargs) { //data must be a Uint8Array
            super(data, ...vargs);
        }
    }

    class IMAGE_NT_HEADERS64 extends memoobjectidk {
        //oh shoot these types have to be in the right order
        static types = {
            Signature: "DWORD",
            //IMAGE_FILE_HEADER
            FileHeader: IMAGE_FILE_HEADER,
            //IMAGE_OPTIONAL_HEADER64
            OptionalHeader: IMAGE_OPTIONAL_HEADER64,
        };
        constructor(data, ...vargs) { //data must be a Uint8Array
            super(data, ...vargs);
        }
    }

    class IMAGE_EXPORT_DIRECTORY extends memoobjectidk {
        static types = {
            Characteristics: "DWORD",
            TimeDateStamp: "DWORD",
            MajorVersion: "WORD",
            MinorVersion: "WORD",
            Name: "DWORD",
            Base: "DWORD",
            NumberOfFunctions: "DWORD",
            NumberOfNames: "DWORD",
            AddressOfFunctions: "DWORD",     // RVA from base of image
            AddressOfNames: "DWORD",         // RVA from base of image
            AddressOfNameOrdinals: "DWORD",  // RVA from base of image
        };
        constructor(data, ...vargs) { //data must be a Uint8Array
            super(data, ...vargs);
        }
    }

    function NewPtrArray(type, length) { //yeah this is kinda weird but you can't really change types or arrayLenghts after you make the class since its static
        class PtrArray extends memoobjectidk {
            static types = {
                //values: "LONG_PTR",  //i assume?
                values: type, //wait why was it DWORD and not LONG_PTR? (oh wait in the stack overflow post they cast names[i] to an int)
            };
            static arrayLengths = {
                values: length,
            };
            constructor(data, ...vargs) { //data must be a Uint8Array
                super(data, ...vargs);
            }
        }
        return new PtrArray(new Uint8Array(PtrArray.sizeof())); //you don't have to initialize a memoobjectidk like this anymore because if data is undefined it will do it for you!
    }

    function readThroughStringAtPtr(ptr) { //https://defuse.ca/online-x86-assembler.htm#disassembly (x64)
        //print(ptr);
        const len = __asm([ //homemade strlen (which includes the null terminator)
            0x31, 0xc0,                                 //xor eax, eax
            0x31, 0xd2,                                 //xor edx, edx
            //0xcc,                                     //debugbreak lol (i accidently set jne to -17 which went too far and was crashing my shit)
            0x8a, 0x14, 0x01,                           //mov dl, BYTE PTR [rcx + 1*rax]
            0xff, 0xc0,                                 //inc eax
            0x80, 0xfa, 0x00,                           //cmp dl, 0
            0x0f, 0x85, 0xf2, 0xff, 0xff, 0xff,         //jne 0xfffffff2 (relative -14) jumps back 14 bytes INCLUDING the jne statement ( 0xfffffff2 == (DWORD)-14 )
            0xc3                                        //ret 
        ], 1, [ptr], [VAR_INT], RETURN_NUMBER);         //rcx is the first integer parameter

        //print(ptr, len);
        //__debugbreak(); //lol it crashed before this

        const str_out = new CString(Object.keys(new Array(len).toString()+1).map(e => "#").join("")); //basically equivalent to std::vector<char> vstr(str.length, '#');
        
        //memcpy(str_out.ptr, ptr, len); //like this

        __asm([ //diy strcpy (oh wait i could've just used memcpy lol)
            0x31, 0xc0,                                 //xor eax, eax
            0x45, 0x31, 0xc0,                           //xor r8d, r8d
            0x44, 0x8a, 0x04, 0x01,                     //mov r8b, BYTE PTR [rcx + 1*rax]
            0x44, 0x88, 0x04, 0x02,                     //mov BYTE PTR [rdx + 1*rax], r8b
            0xff, 0xc0,                                 //inc eax
            0x41, 0x80, 0xf8, 0x00,                     //cmp r8b, 0
            0x0f, 0x85, 0xec, 0xff, 0xff, 0xff,         //jne 0xffffffec (relative -20) lowkey i can't really get this website https://defuse.ca/online-x86-assembler.htm#disassembly to put the jmp instructions correctly so i have to write the jump location myself
            0xc3,                                       //ret
        ], 2, [ptr, str_out.ptr], [VAR_INT, VAR_INT], RETURN_NUMBER);

        //print(str_out.value);

        return str_out.value;
    }

    return function(lib) {
        //technique snatched from The Stack: https://stackoverflow.com/questions/1128150/win32-api-to-enumerate-dll-export-functions
        print("lib:",lib);
        const dosHeader = new IMAGE_DOS_HEADER();
        memcpy(PointerFromArrayBuffer(dosHeader.data), lib, IMAGE_DOS_HEADER.sizeof()); //this shit LMAO
        //print("dosHeader:",dosHeader);
        const imageHeaders = new IMAGE_NT_HEADERS64();
        memcpy(PointerFromArrayBuffer(imageHeaders.data), lib+dosHeader.e_lfanew, IMAGE_NT_HEADERS64.sizeof());
        //print("imageHeaders:",imageHeaders);
        const exportDirectory = new IMAGE_EXPORT_DIRECTORY();
        memcpy(PointerFromArrayBuffer(exportDirectory.data), lib+imageHeaders.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress, IMAGE_EXPORT_DIRECTORY.sizeof());
        //print("exportDirectory:",exportDirectory);
        const namesdoublepointer = lib+exportDirectory.AddressOfNames;
        //print("namesdoublepointer:",namesdoublepointer);
        const namesarray = NewPtrArray("INT", exportDirectory.NumberOfNames); //he casts names[i] to an int!
        memcpy(PointerFromArrayBuffer(namesarray.data), namesdoublepointer, namesarray.data.byteLength);
        //print("namesarray:",namesarray);
        let names = [];
        for(let i = 0; i < exportDirectory.NumberOfNames; i++) {
            const nameptr = lib+namesarray.values[i];
            //print("nameptr:",nameptr, readThroughStringAtPtr(nameptr));
            names.push(readThroughStringAtPtr(nameptr));
        }
        return names;
        //for(let i = 0; i < exportDirectory.NumberOfNames; i++) {
        //    //well i think c++ would do this part for you but i gotta go through the memory until i find the null terminator
        //    const name = "";
        //    //how the hell would i read a byte at a memory location in jbs3 RIGHT NOW (without changing jbs) besides using asm... (no way i'd actually have to use assembly if i didn't feel like modifying jbs)
        //    
        //    //print(`Export: ${}`);
        //}        
    }
})();