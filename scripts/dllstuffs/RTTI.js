//getting the RTTICompleteObjectLocator from jbs3's Direct2D class
print(__dirname);
eval(require("fs").read(__dirname+"/marshallib.js"));

const d2d = createCanvas("d2d", ID2D1DeviceContext, GetConsoleWindow()); //i just want the Direct2D object (internalDXPtr)

print("getting the RTTICompleteObjectLocator from jbs3's Direct2D class");

print(d2d.internalDXPtr, d2d.internalPtr);

//https://github.com/light-tech/MSCpp/blob/master/include/msvc/rttidata.h
class RTTICompleteObjectLocator extends memoobjectidk { //https://www.lukaszlipski.dev/post/rtti-msvc/
    static types = {
        signature: "ULONG", //for x64 this value is COL_SIG_REV1 (1)
        offset: "ULONG",
        cdOffset: "ULONG",
        pTypeDescriptor: "INT", //pointer relative to the base of this exe
        pClassDescriptor: "INT", //pointer relative to the base of this exe
        pSelf: "INT", //pointer relative to the base of this exe
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

//https://github.com/light-tech/MSCpp/blob/master/include/msvc/ehdata_forceinclude.h#L86
class TypeDescriptor extends memoobjectidk {
    static types = {
        pVFTable: "ULONG_PTR",
        spare: "ULONG_PTR",
        name: "ULONG_PTR", //it's defined like char name[]; and because we don't know how long it is we not gonna bother with all that right here
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

const CHD_MULTINH =					0x00000001
const CHD_VIRTINH =					0x00000002
const CHD_AMBIGUOUS	=				0x00000004

class RTTIClassHierarchyDescriptor extends memoobjectidk {
    static types = {
        signature: "ULONG", //always 0
        attributes: "ULONG", //bitfield of CHD_* consts
        numBaseClasses: "ULONG", //number of RTTIBaseClassDescriptors 
        pBaseClassArray: "INT", //pointer relative to base of exe
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

function newRTTIBaseClassArray(num) { //kinda weird technique to get an object-specific array length with marshallib
    class RTTIBaseClassArray extends memoobjectidk {
        static types = {
            arrayOfBaseClassDescriptors: "INT", //holds pointers relative to the base of the exe (jbs3.exe GetModuleHandle(NULL)) 
        };
        static arrayLengths = {
            arrayOfBaseClassDescriptors: num,
        };
        constructor(data, ...vargs) { //data must be a Uint8Array
            super(data, ...vargs);
        }
    }
    return new RTTIBaseClassArray();
}

class PMD extends memoobjectidk {
    static types = {
        mdisp: "INT",
        pdisp: "INT",
        vdisp: "INT",
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

const BCD_NOTVISIBLE = 0x00000001;
const BCD_AMBIGUOUS = 0x00000002;
const BCD_PRIVORPROTBASE = 0x00000004;
const BCD_PRIVORPROTINCOMPOBJ = 0x00000008;
const BCD_VBOFCONTOBJ = 0x00000010;
const BCD_NONPOLYMORPHIC = 0x00000020;
const BCD_HASPCHD = 0x00000040;			// pClassDescriptor field is present

class RTTIBaseClassDescriptor extends memoobjectidk {
    static types = {
        pTypeDescriptor: "INT", //relative
        numContainedBases: "ULONG",
        where: PMD,
        attributes: "ULONG", //bitfield of BCD_* consts
        pClassDescriptor: "INT", //relative
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

//apparently a pointer to an RTTICompleteObjectLocator struct is set 8 bytes BEFORE a vtable
const __vtptr = d2d.internalDXPtr; //(the first 8 bytes of an object with virtual methods points to the vtable) (or maybe the vbtable idk much about  that yet lol lets assume it's the vtable)
const RTTIPtr = dereference(__vtptr, "ULONGLONG")-8; //*(unsigned long long*)__vtptr
const locator = dereference(RTTIPtr, RTTICompleteObjectLocator); //COPY!
//memcpy(PointerFromArrayBuffer(locator.data), __vtptr)
print();
print("RTTICompleteObjectLocator:");
print("  signature:", locator.signature);
print("  offset:", locator.offset);
print("  cdOffset:", locator.cdOffset);
print("  pTypeDescriptor:", locator.pTypeDescriptor); //pointer relative to base
print("  pClassDescriptor:", locator.pClassDescriptor); //pointer relative to base
print("  pSelf:", locator.pSelf); //pointer relative to base
print();
const base = GetModuleHandle(NULL); //oh apparently i could've calculated the base     it's not working tho (RTTIPtr-locator.pSelf)
print("base:", base, "TypeDescriptor ptr:", locator.pTypeDescriptor+base);
//no dereference here because we just know where it is in memory
const tDesc = new TypeDescriptor();
memcpy(PointerFromArrayBuffer(tDesc.data), base+locator.pTypeDescriptor, TypeDescriptor.sizeof());
//since name is a weird property im just gonna set it to a pointer to the shit
tDesc.name = base+locator.pTypeDescriptor+TypeDescriptor.sizeof()-sizeof["ULONG_PTR"];

print();
print("TypeDescriptor:");
print("  pVFTable:", tDesc.pVFTable);
print("  spare:", tDesc.spare);
print("  name:", StringFromPointer(tDesc.name)); //mangled name
print();
//print(tDesc);
//print(StringFromPointer(tDesc.name)); //yeah sure

const classHDesc = new RTTIClassHierarchyDescriptor();
memcpy(PointerFromArrayBuffer(classHDesc.data), base+locator.pClassDescriptor, RTTIClassHierarchyDescriptor.sizeof());
print("ClassDescriptor ptr:", base+locator.pClassDescriptor); //, classHDesc);
print();
print("RTTIClassHierarchyDescriptor:");
print("  signature:", classHDesc.signature);
print("  attributes:", classHDesc.attributes);
print("  numBaseClasses:", classHDesc.numBaseClasses);
print("  pBaseClassArray:", classHDesc.pBaseClassArray);
print();

const baseClassArr = newRTTIBaseClassArray(classHDesc.numBaseClasses);
//print(baseClassArr);
memcpy(PointerFromArrayBuffer(baseClassArr.data), base+classHDesc.pBaseClassArray, baseClassArr.constructor.sizeof()); //ahhh i accidently did baseClassArr.prototype but it wasn't working lol
print("RTTIBaseClassArray ptr:", base+classHDesc.pBaseClassArray); //, baseClassArr);
print();
print("RTTIBaseClassArray: {");
print("  arrayOfBaseClassDescriptors: ", baseClassArr.arrayOfBaseClassDescriptors);

for(let i = 0; i < classHDesc.numBaseClasses; i++) {
    const offset = baseClassArr.arrayOfBaseClassDescriptors[i];
    const ptr = base+offset;
    const baseClassDesc = new RTTIBaseClassDescriptor();
    memcpy(PointerFromArrayBuffer(baseClassDesc.data), ptr, RTTIBaseClassDescriptor.sizeof());
    //print(ptr, baseClassDesc);
    print();
    print("    RTTIBaseClassDescriptor", i);
    print("      pTypeDescriptor:", baseClassDesc.pTypeDescriptor);
    print("      numContainedBases:", baseClassDesc.numContainedBases);
    print("      where: {");
    print("        mdisp:", baseClassDesc.where.mdisp);
    print("        pdisp:", baseClassDesc.where.pdisp);
    print("        vdisp:", baseClassDesc.where.vdisp);
    print("      }");
    print("      attributes:", baseClassDesc.attributes);
    print("      pClassDescriptor:", baseClassDesc.pClassDescriptor);
}
print("}");