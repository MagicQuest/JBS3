//rawr https://www.codeproject.com/Articles/5351958/Direct2D-Tutorial-Part-5-Text-Display-and-Font-Enu
//let windowhtml = `<window text="skibidi"></window>` //nah this would be crazy but i can't be bothered to make an xml parser because i've never done that (suprisingly)
//let windowhtml = 
//`<window title="skibidi">
//    <static dimensions="16 16 ${256-32} 32" font="system">Select Your Font</static>
//    <static dimensions="256 16 ${512-64} 32" font="system">Add Text Here</static>
//</window>`;
let d2d;
let fonts = {};
let window = {tag: "window", title:"skibidi", children: [
    {tag: "static", text: "Select Your Font", dimensions: `16 16 ${256-32} 16`, font: "system"},
    {tag: "static", text: "Add Text Here", dimensions: `256 16 ${512-64} 16`, font: "system"},
    {tag: "button", text: "skibdyi", dimensions: `0 0 16 16`, font: "system", menu: 1},
]};
function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        //let lines = windowhtml.split("\n");
        //let inside = [];
        //let mrth = false; //maybe raven team header (maybe reading tag head)
        //for(let i = 0; i < windowhtml.length; i++) {
        //    const char = windowhtml[i];
        //    if(char == "<") {
        //        mrth = 1;
        //    }else if(char == "/") {
        //        mrth = -1;
        //    }else if(char == ">") {
        //        mrth = false;
        //    }else if(mrth == -1) {
        //        
        //    }
        //}
        //let tagexr = /<([a-z]+) ([a-z]+)=(".+")>/
        //for(let line of lines) {
        //    //i gotta start thinking outside of the box dawg
        //    let match = line.match(tagexr);
        //    let tag = match[1];
        //    let obj = {};
        //    for(let i = 2; i < match.length; i+=2) {
        //        obj[match[i]] = match[i+1];
        //    }
        //    print(tag, obj);
        //    //let langle = line.indexOf("<")+1;
        //    //let rangle = line.indexOf(">", langle);
        //    //let taginfo = line.substring(langle, rangle);
        //    //let tag = taginfo.split(" ")[0];
        //    //let allothershit = [];
        //    //taginfo.substring(tag.length+1);
        //    //let obj = {};
        //    //print(tag, allothershit);
        //}
        fonts.system = GetDefaultFont();
        SetWindowText(hwnd, window.title);
        for(let child of window.children) {
            let {tag, font} = child;
            let [x, y, width, height] = child.dimensions.split(" ");
            let newhwnd = CreateWindow(NULL, tag, child.text, WS_CHILD | WS_VISIBLE, x, y, width, height, hwnd, child.menu, hInstance);
            SendMessage(newhwnd, WM_SETFONT, fonts[font], true);
        }

        d2d.EnumFonts((fontFamily) => { //bruhhhh i made enum fonts for taskslifeifoundamongus (which im realizing now that i mispelt like) because CreateFont wasn't working and i thought the fonts were messed up but CreateFont was just geniuinely not working earlier like idk
            print(fontFamily.GetFamilyName(), fontFamily.GetFontCount());
            fontFamily.Release(); //unfortunately (if the second param for EnumFonts is true) you have to release if you're done with this shit
        }, true); //specifying false only passes the names of the font families and specifiying true passes IDWriteFontFamily objects (which you have to release)
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("skibidifontenum", windowProc); //max classname length is 256 lol
wc.hCursor = LoadCursor(NULL, IDC_HAND);//LoadIcon(NULL, IDI_APPLICATION); //haha just learned that you can use icons instead
wc.hbrBackground = COLOR_WINDOW+1;

CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512, 512, NULL, NULL, hInstance);