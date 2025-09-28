//for SHA1
eval(require("fs").read(__dirname+"/hashes.js")); //https://github.com/h2non/jshashes

//for atob and btoa (which i didn't realize weren't included in v8)
//ok wait i didn't need it lol
//eval(require("fs").read(__dirname+"/base64.js")); //https://github.com/MaxArt2501/base64-js

const SHA1 = new Hashes.SHA1;

let hits = 0;

const rngdata = WSAStartup(MAKEWORD(2, 2));
print(rngdata);

const listening = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
print(listening);

if(listening == INVALID_SOCKET) {
    print("fuck ts invalid");
    const err = WSAGetLastError();
    print("FUCK SOMETHING WENT FUC (" + _com_error(err) + ") [" + err + "]");
    print(WSACleanup());
    quit;
}

const hint = new sockaddr_in(AF_INET, htons(25565));
//print(hint, ntohs(hint.sin_port));

print(inet_pton(AF_INET, "127.0.0.1", hint.sin_addr)); //pass sin_addr "directly" instead of by & reference in c++ lool
//print(hint);

let res = bind(listening, hint);
if(res == SOCKET_ERROR) {
    const err = WSAGetLastError();
    print("FUCK SOMETHING WENT FUC (" + _com_error(err) + ") [" + err + "]");
    closesocket(listening);
    print(WSACleanup());
    quit;
}

res = listen(listening, SOMAXCONN);
if(res == SOCKET_ERROR) {
    const err = WSAGetLastError();
    print("listen failed? (" + _com_error(err) + ") [" + err + "]");
    closesocket(listening);
    print(WSACleanup());
    quit;
}

//if(ioctlsocket(listening, FIONBIO, 1) == SOCKET_ERROR) {
//    const err = WSAGetLastError();
//    printNoHighlight("<ioctlsocket FIONBIO failed?> (" + _com_error(err) + ") [" + err + "]");
//    closesocket(listening);
//    print(WSACleanup());
//    quit;
//}

const master_set = new fd_set();
FD_SET(listening, master_set);

const sockaddr_map = {};

//let read_fds = new fd_set();

print(listening, master_set, master_set[0]);

function del_socket(socket) {
    print("dial tone", socket);
    sockaddr_map[socket].Drop(socket);
    closesocket(socket);
    FD_CLR(socket, master_set);
    delete sockaddr_map[socket];
}

function actually_send_all_the_data_for_me_kthxbai(socket, arr) {
    printNoHighlight(arr);

    const dry = send(socket, arr, true, 0); //no wstrfings lol

    let closedconnection = false;

    print("sent:", dry, "out of", arr.length);
    if(dry == SOCKET_ERROR) {
        const err = WSAGetLastError();
        printNoHighlight("<send failed?> (" + _com_error(err) + ") [" + err + "]");
        del_socket(socket);
        closedconnection = true;
    }else if(dry != arr.length) {
        print("aw FUCK it didn't send all the data:", dry, "<", arr.length); //no god damn way the reason it wasn't sending all the data was because of an INSANE bug that has literally been around since i started jbs (because i don't understand v8)
        if(IsDebuggerPresent()) {
            __debugbreak();
        }else {
            printNoHighlight("welp we would've __debugbreaked but no debugger lol\x07");
        }
        const len = arr.length-dry;
        let total = dry;
        let bytesleft = len;
        let n;
        let sent = arr.slice(0, total);
        while(total < len) {
            print(arr.slice(total));
            n = send(socket, arr.slice(total), true, 0);
            print("n:",n,"(",socket,")");
            if(n == SOCKET_ERROR) {
                const err = WSAGetLastError();
                printNoHighlight("<send failed?> (" + _com_error(err) + ") [" + err + "]");
                print("Sent data:",sent);
                del_socket(socket);
                closedconnection = true;
                break;
            }
            sent += result.slice(total, total+n);
            total += n;
            bytesleft -= n;
            print("new total:", total,"bytesleft:",bytesleft);
        }
        if(n!=SOCKET_ERROR) {
            print("Sent data:",sent);
        }
    }
    return closedconnection;
}

print("master_set:",master_set._ptr);

class basehttp {
    constructor() {
        this.headers = {};
    }

    setHeader(header, value) {
        this.headers[header] = value;
    }
}

class http_request extends basehttp {
    constructor(method, path) {
        super();
        this.path = path;
        this.method = method;
    }

    static parse(raw) {
        //first line should tell us method and path :)
        const lines = raw.split("\n");
        const first = lines[0].split(" ");
        print("parsing http request:", first[0], first[1]);
        const temp = new http_request(first[0], first[1]);

        //headers come after
        //i = 1 because we already read the first line nigga
        for(let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const c = line.indexOf(":");
            if(c == -1) {
                break;
            }
            const header = line.substring(0, c);
            const value = line.substring(c+1).trim(); //using trim because the header could be like "Content-Type: ..." and not "Content-Type:..." (note the space between the color and value)
            print(`"${header}": "${value}"`);
            temp.setHeader(header, value);
        }

        return temp;
    }
}

class http_response extends basehttp {
    static statusMessageMap = {
        100: "Continue",
        101: "Switching Protocols",
        102: "Processing Deprecated",
        103: "Early Hints",
        200: "OK",
        201: "Created",
        202: "Accepted",
        203: "Non-Authoritative Information",
        204: "No Content",
        205: "Reset Content",
        206: "Partial Content",
        207: "Multi-Status",
        208: "Already Reported",
        226: "IM Used",
        300: "Multiple Choices",
        301: "Moved Permanently",
        302: "Found",
        303: "See Other",
        304: "Not Modified",
        305: "Use Proxy Deprecated",
        306: "unused",
        307: "Temporary Redirect",
        308: "Permanent Redirect",
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Content Too Large",
        414: "URI Too Long",
        415: "Unsupported Media Type",
        416: "Range Not Satisfiable",
        417: "Expectation Failed",
        418: "I'm a teapot",
        421: "Misdirected Request",
        422: "Unprocessable Content",
        423: "Locked",
        424: "Failed Dependency",
        425: "Too Early Experimental",
        426: "Upgrade Required",
        428: "Precondition Required",
        429: "Too Many Requests",
        431: "Request Header Fields Too Large",
        451: "Unavailable For Legal Reasons",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "HTTP Version Not Supported",
        506: "Variant Also Negotiates",
        507: "Insufficient Storage",
        508: "Loop Detected",
        510: "Not Extended",
        511: "Network Authentication Required",
    }

    constructor(socket) {
        super();
        this.statusCode = 200;
        this.status = "OK";
        this.body = ""; //t
        this.socket = socket;
    }

    setStatus(code, message) {
        this.statusCode = code;
        if(message) {
            this.status = message;
        }else {
            this.status = http_response.statusMessageMap[code];
        }
        return this;
    }

    setStatusMessage(message) {
        this.status = message;
        return this;
    }

    write(body) {
        this.body = body;
        this.setHeader("Content-Length", this.body.length);
        return this;
    }

    append(body) {
        this.body += body;
        this.setHeader("Content-Length", this.body.length);
        return this;
    }

    //returns whether or not this function closed the connection with the socket
    send(content) {
        if(content) {
            this.write(content);
        }
        const result = this.toString();

        let closedconnection = actually_send_all_the_data_for_me_kthxbai(this.socket, result);

        if(!closedconnection && this.statusCode == 404) { //we just gonna close the connection lol
            del_socket(this.socket);
            closedconnection = true; 
        }

        return closedconnection;
    }

    toString() {
        return `HTTP/1.1 ${this.statusCode} ${this.status}\n`+Object.entries(this.headers).reduce((r, l) => r+=`${l[0]}: ${l[1]}\n`, "")+"\n"+this.body;
    }
}

/*
io.on("connection", (socket) => {
    //socket.emit("pixels",PIXELSCALE);//, pixels, PIXELSCALE);

    socket.on("place", (x, y, rgb) => {
        let i = Math.round(y)*(PIXELSCALE*4)+Math.round(x)*4;
        pixels[i] = rgb[0];
        pixels[i+1] = rgb[1];
        pixels[i+2] = rgb[2];
        context.putImageData(new ImageData((pixels), PIXELSCALE), 0, 0);
        io.emit("placed", x,y,rgb);
    });

    socket.on("insert", (x, y, src) => {
        console.log(x,y,src);
        let img = new Image();
        img.onload = function() {
            context.drawImage(img, x, y);
            pixels = context.getImageData(0, 0, PIXELSCALE, PIXELSCALE).data;
            io.emit("reload");
        }
        img.src = src; //i need that svelte {src}
    });
});

*/

/*
function reverse(bits, n) {
    n=BigInt(n);
    const str = bits.toString(2).split("");
    const result = bits.toString(2).split("");
    //if(n % 2 == 0) {
        for(let i = 0n; i < n/2n; i++) {
            result[i] = str[(n-i)-1n];
            result[(n-i)-1n] = str[i];
        }
    //}
    return Number("0b"+result.join(""));
}

class Reader {
    static consecutivebits = {1: 0b1n, 2: 0b11n, 3: 0b111n, 4: 0b1111n, 5: 0b11111n, 6: 0b111111n, 7: 0b1111111n, 8: 0b11111111n}; //i feel like yandere dev leaving bullshit like this here when there very well could be a better way (this shit O(1) tho.)

    constructor(raw) {
        this.bitpos = 0n;
        this.raw = raw;
    }

    readNBits(n) {
        n=BigInt(n);
        let i = this.bitpos/8n;
        let offset = this.bitpos % 8n;
        //let byte = raw[i];
        print(i, offset, this.raw[i]);
        let result = 0n;
        if(offset + n > 8n) {
            print("g2g!");
            let temp = n;
            let mod = 0n;
            //take out the 8 - offset and do it before the loop so i don't have oofset = 0 in the loop weirdly
            while(temp != 0n) {
                //result <<= temp;
                mod = BigInt(Math.min(8 - Number(offset), Number(temp)));
                result |= (BigInt(this.raw[i]) >> (offset) & Reader.consecutivebits[mod]) << (temp-mod);
                i++;
                //byte = raw[i];
                //offset = (mod+offset) % 8;
                offset = 0n;
                temp -= mod;
            }
        }else {
            result = BigInt(this.raw[i]) >> (offset) & Reader.consecutivebits[n];
        }
        this.bitpos += n;
        return reverse(result, n);
    }

    readBit() {
        return this.readNBits(1);
    }

    readByte() {
        return this.readNBits(8);
    }

    readNBytes(n) {
        return this.readNBits(8*n);
    }

    readNBytesAsArray(n) {
        //n*=8;
        //let i = Math.floor(this.bitpos/8);
        //let offset = this.bitpos % 8;
        ////let byte = raw[i];
        //print(i, offset, this.raw[i]);
        //let result = [];
        //if(offset + n > 8) {
        //    print("g2g!");
        //    let temp = n;
        //    let mod = 0;
        //    //take out the 8 - offset and do it before the loop so i don't have oofset = 0 in the loop weirdly
        //    while(temp != 0) {
        //        //result <<= temp;
        //        mod = Math.min(8 - offset, temp);
        //        result.push(reverse(this.raw[i] >> (offset) & Reader.consecutivebits[mod], mod));
        //        i++;
        //        //byte = raw[i];
        //        //offset = (mod+offset) % 8;
        //        offset = 0;
        //        temp -= mod;
        //    }
        //}else {
        //    result.push(reverse(this.raw[i] >> offset & Reader.consecutivebits[n], n));
        //}
        //this.bitpos += n;
        //return result;

        n=BigInt(n*8);
        let i = this.bitpos/8n;
        let offset = this.bitpos % 8n;
        //let byte = raw[i];
        print(i, offset, this.raw[i]);
        let result = [];
        if(offset + n > 8n) {
            print("g2g!");
            let temp = n;
            let mod = 0n;
            //take out the 8 - offset and do it before the loop so i don't have oofset = 0 in the loop weirdly
            while(temp != 0n) {
                //result <<= temp;
                mod = BigInt(Math.min(8 - Number(offset), Number(temp)));
                result.push(reverse(BigInt(this.raw[i]) >> (offset) & Reader.consecutivebits[mod]));
                i++;
                //byte = raw[i];
                //offset = (mod+offset) % 8;
                offset = 0n;
                temp -= mod;
            }
        }else {
            result = reverse(BigInt(this.raw[i]) >> (offset) & Reader.consecutivebits[n], n);
        }
        this.bitpos += n;
        return result;
    }

    reset() {
        this.bitpos = 0;
    }
}
*/

//https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#decoding_payload_length
function getPayloadDecoded(frame, firstIndexAfterPayloadLength) {
    const mask = frame.slice(
        firstIndexAfterPayloadLength,
        firstIndexAfterPayloadLength + 4,
    );
    const encodedPayload = frame.slice(firstIndexAfterPayloadLength + 4);
    // XOR each 4-byte sequence in the payload with the bitmask
    const decodedPayload = encodedPayload.map((byte, i) => byte ^ mask[i % 4]);
    return decodedPayload;
}

/*function reverse(bits, n) {
    const str = bits.toString(2).split("");
    const result = bits.toString(2).split("");
    //if(n % 2 == 0) {
        for(let i = 0; i < Math.floor(n/2); i++) {
            result[i] = str[(n-i)-1];
            result[(n-i)-1] = str[i];
        }
    //}
    return Number("0b"+result.join(""));
}*/

class Reader {
    static consecutivebits = {1: 0b1, 2: 0b11, 3: 0b111, 4: 0b1111, 5: 0b11111, 6: 0b111111, 7: 0b1111111, 8: 0b11111111}; //i feel like yandere dev leaving bullshit like this here when there very well could be a better way (this shit O(1) tho.)

    constructor(raw) {
        this.bitpos = 0;
        this.raw = raw;
    }

    readNBits(n) {
        debugger;
        let i = Math.floor(this.bitpos/8);
        let offset = this.bitpos % 8;
        //let byte = raw[i];
        print(i, offset, this.raw[i]);
        let result = 0;
        if(offset + n > 8) {
            print("g2g!");
            let temp = n;
            let mod = 0;
            //take out the 8 - offset and do it before the loop so i don't have oofset = 0 in the loop weirdly
            while(temp != 0) {
                //result <<= temp;
                mod = Math.min(8 - offset, temp);
                result |= (this.raw[i] >> ((7-offset) - (mod-1)) & Reader.consecutivebits[mod]) << (n-temp);
                i++;
                //byte = raw[i];
                //offset = (mod+offset) % 8;
                offset = 0;
                temp -= mod;
            }
        }else {
            result = this.raw[i] >> ((7-offset) - (n-1)) & Reader.consecutivebits[n];
        }
        this.bitpos += n;
        return result; //reverse(result, n);
    }

    readBit() {
        return this.readNBits(1);
    }

    readByte() {
        return this.readNBits(8);
    }

    readNBytes(n) {
        return this.readNBits(8*n);
    }

    //readNBytesAsArray(n) {
    //    n*=8;
    //    let i = Math.floor(this.bitpos/8);
    //    let offset = this.bitpos % 8;
    //    //let byte = raw[i];
    //    print(i, offset, this.raw[i]);
    //    let result = [];
    //    if(offset + n > 8) {
    //        print("g2g!");
    //        let temp = n;
    //        let mod = 0;
    //        //take out the 8 - offset and do it before the loop so i don't have oofset = 0 in the loop weirdly
    //        while(temp != 0) {
    //            //result <<= temp;
    //            mod = Math.min(8 - offset, temp);
    //            result.push(reverse(this.raw[i] >> (offset) & Reader.consecutivebits[mod], mod));
    //            i++;
    //            //byte = raw[i];
    //            //offset = (mod+offset) % 8;
    //            offset = 0;
    //            temp -= mod;
    //        }
    //    }else {
    //        result.push(reverse(this.raw[i] >> offset & Reader.consecutivebits[n], n));
    //    }
    //    this.bitpos += n;
    //    return result;
    //}

    reset() {
        this.bitpos = 0;
    }
}

const WEBSOCKET_OPCODE_CONTINUATION = 0x0;
const WEBSOCKET_OPCODE_TEXT = 0x1;
const WEBSOCKET_OPCODE_BINARY = 0x2;
//reserved...
const WEBSOCKET_OPCODE_CLOSE = 0x8;
const WEBSOCKET_OPCODE_PING = 0x9;
const WEBSOCKET_OPCODE_PONG = 0xA;
//reserved...

class WebSocketPayload {
    static new(opcode, data) {
        //we're just gonna send all the info at once i don't need to try fragmenting lol
        const fin = 1; //1
        const rsv1 = 0; //1
        const rsv2 = 0; //1
        const rsv3 = 0; //1 
        //const opcode = 1; //4
        const mask = 0; //1

        const packet = [
            opcode | rsv3 << 4 | rsv2 << 5 | rsv1 << 6 | fin << 7,
        ];

        let length = data.length;
        let extendedLength = 0;
        if(data.length > 126) {
            if(data.length < (2**16)) {
                length = 126;
                extendedLength = htons(length); //reverse(length, 16); //wait isn't there a function for this?
                //bytes.push(extendedLength & Reader.consecutivebits[8]);
                //bytes.push((extendedLength >> 8) & Reader.consecutivebits[8]);

                //i gotta be honest im not 100% sure this is correct but fortunately i'm probably not gonna be sending that much information
                packet.push(
                    length | mask << 7,
                    extendedLength & Reader.consecutivebits[8],
                    (extendedLength >> 8) & Reader.consecutivebits[8],
                );
            }else {
                length = 127;
                extendedLength = htonll(length);
                //bytes.push(extendedLength & Reader.consecutivebits[8]);
                //bytes.push((extendedLength >> 8) & Reader.consecutivebits[8]);
                //bytes.push((extendedLength >> 16) & Reader.consecutivebits[8]);
                //bytes.push((extendedLength >> 24) & Reader.consecutivebits[8]);
                packet.push(
                    length | mask << 7,
                    extendedLength & Reader.consecutivebits[8],
                    (extendedLength >> 8) & Reader.consecutivebits[8],
                    (extendedLength >> 16) & Reader.consecutivebits[8],
                    (extendedLength >> 24) & Reader.consecutivebits[8],
                );
            }
        }else {
            packet.push(length | mask << 7);
        }
        //im not too sure about the endianness of the payload so we're just gonna send the same thing
        packet.push(...data);
        return new Uint8Array(packet);
    }
}

class WebSocketRepresentation {
    #eventListeners = {};
    incomingData = [];
    closing = false;
    //dang i want payload to be private but a friend to WebSocketManager... no can do buddy.

    //static #events = {
    //    "message": WebSocketManager.defaultEventDispatcher,
    //    "disconnect": WebSocketManager.defaultEventDispatcher,
    //}
    //3.14159265358979323

    constructor(socket) {
        this.socket = socket;
    }

    on(event, callback) {
        event = event.toLowerCase();
        if(!this.#eventListeners[event]) {
            this.#eventListeners[event] = [];
        }
        this.#eventListeners[event].push(callback);
    }

    fireEvent(event, extra) {
        event = event.toLowerCase();
        if(!this.#eventListeners[event] || this.#eventListeners[event].length == 0) { //if nobody is listening to this event then we'll just return (otherwise you get a TypeError lol)
            return;
        }
        //WebSocketRepresentation.#events[event](this.#eventListeners[event], extra);
        for(const callback of this.#eventListeners[event]) {
            callback(extra);
        }
    }

    emit(strMessage) {
        sockaddr_map[this.socket].write(WebSocketPayload.new(WEBSOCKET_OPCODE_TEXT, strMessage.split("").map(l=>l.charCodeAt(0))));
    }

    ping(payload) {
        print("Pinging",this.socket,"!");
        sockaddr_map[this.socket].write(WebSocketPayload.new(WEBSOCKET_OPCODE_PING, payload));
    }

    pong(payload) {
        print("Replying to", this.socket, "with pong");
        sockaddr_map[this.socket].write(WebSocketPayload.new(WEBSOCKET_OPCODE_PONG, payload));
    }

    close(statusCode, strMessage) {
        if(this.closing) {
            return;
        }
        print("WebSocketRepresentation close", this.socket);
        // del_socket(this.socket);
        const code = [(statusCode >> 8) & 0xff, statusCode & 0xff, ...strMessage.split("").map(l=>l.charCodeAt(0))];
        sockaddr_map[this.socket].write(WebSocketPayload.new(WEBSOCKET_OPCODE_CLOSE, code));
        this.closing = true;
    }
}

//const prop = "sigma";
//class bruh {
//    constructor() {
//
//    }
//    
//    [prop]() { //wait WTF? you can actually set properties of a class with the bracket thing too?!
//        return prop;
//    }
//}
//const b = new bruh;
//b[prop](); //"sigma"

class WebSocketManager {
    static #websockets = {};
    static #eventListeners = {};
    //static defaultEventDispatcher(listeners, extra) {
    //    for(const callback of listeners) {
    //        //button
    //        callback(extra);
    //    }
    //}
    //static #events = {
    //    "connection": WebSocketManager.defaultEventDispatcher,
    //}
    
    static on(event, callback) {
        event = event.toLowerCase();
        if(!this.#eventListeners[event]) {
            this.#eventListeners[event] = [];
        }
        this.#eventListeners[event].push(callback);
    }

    static #fireEvent(event, extra) {
        event = event.toLowerCase();
        if(!this.#eventListeners[event] || this.#eventListeners[event].length == 0) { //if nobody is listening to this event then we'll just return (otherwise you get a TypeError lol)
            return;
        }
        //this.#events[event](this.#eventListeners[event], extra);
        for(const callback of this.#eventListeners[event]) {
            callback(extra);
        }
    }

    static emit(strMessage) {
        for(const websocket of WebSocketManager.#websockets) {
            websocket.emit(strMessage);
        }
    }

    static connect(socket) {
        const websocket = new WebSocketRepresentation(socket);
        WebSocketManager.#websockets[socket] = websocket;
        this.#fireEvent("connection", websocket);
    }
    
    //raw must be a Uint8Array!
    static collectMessage(socket, raw) {
        const websocket = WebSocketManager.#websockets[socket];
        //uh oh the raw bytes are unfortunately complicated
        //const fin = raw[0] & 1;
        //const rsv1 = raw[0] >> 1 & 1;
        //const rsv2 = raw[0] >> 2 & 1;
        //const rsv3 = raw[0] >> 3 & 1;
        //const opcode = raw[0] >> 4 & 0b1111;
        //const mask = raw[1] & 1;
        //const length = raw[1] >> 1;
        //let reallen;
        //if(length < 126) {
        //    reallen = length;
        //}else if(length == 126) {
        //    reallen = raw[2] << 8 | raw[3]; //network byte order: big endian!
        //}else if(length == 127) {
        //
        //}
        //if(mask) {
        //
        //}

        //wait so is the whole thing big endian?

        const reader = new Reader(raw);
        
        const fin = reader.readBit();
        const rsv1 = reader.readBit(); //im supposed to _Fail the WebSocket Connection_ if these are nonzero AND i didn't negotiate any extensions
        const rsv2 = reader.readBit(); //im supposed to _Fail the WebSocket Connection_ if these are nonzero AND i didn't negotiate any extensions
        const rsv3 = reader.readBit(); //im supposed to _Fail the WebSocket Connection_ if these are nonzero AND i didn't negotiate any extensions
        const opcode = reader.readNBits(4);

        const mask = reader.readBit(); //im also supposed to _Fail the WebSocket Connection_ if the client sends an unmasked packet
        if(!mask) {
            websocket.close(1002, "Server received unmasked packet");
            return;
        }
        const length = reader.readNBits(7);

        let realLength = 0;

        if(length < 126) {
            realLength = length;
        }else if(length == 126) {
            realLength = reader.readNBytes(2);
        }else if(length == 127) {
            realLength = reader.readNBytes(8); //gul[p]
        }

        //if(mask) {
        //    const key = reader.readNBytes(4); //door
        //}
        const payload = getPayloadDecoded(raw, reader.bitpos/8); //thank you mdn
        websocket.incomingData.push(...payload);
        print("FIN:", fin, ", RSV1:",rsv1,",RSV2:",rsv2,",RSV3:",rsv3,",OPCODE:",opcode,",MASK:",mask,",LENGTH:",length);
        if(fin) {
            if(opcode == WEBSOCKET_OPCODE_TEXT) {
                websocket.fireEvent("message", String.fromCharCode(...websocket.incomingData));
                websocket.incomingData = [];
            }else if(opcode == WEBSOCKET_OPCODE_CLOSE) {
                //print(websocket.incomingData);
                //print(String.fromCharCode(...websocket.incomingData));
                //SetForegroundWindow(GetConsoleWindow());
                //try {
                //   print(eval(getline("a websocket wants to close this connection (what was the payload?): ")));
                //}catch(e) {
                //   print(e.toString());
                //}
                const statusCode = websocket.incomingData[0] << 8 | websocket.incomingData[1]; //bruh this part wasn't working because raw was an Int8Array and not a Uint8Array
                const message = String.fromCharCode(...websocket.incomingData.slice(2));
                print("websocket wants to close~!");
                print("(",statusCode,"):",message);
                websocket.close(statusCode, message);
            }else if(opcode == WEBSOCKET_OPCODE_PING) {
                //print("websocket ping!");
                websocket.pong();
            }
        }
        
        //websocket.fireEvent("message", );
    }

    //static #dispatchMessage(socket, raw) {
    //    const websocket = WebSocketManager.#websockets[socket];
    //    websocket.fireEvent("message", );
    //}

    static disconnect(socket) {
        const websocket = WebSocketManager.#websockets[socket];
        websocket.fireEvent("disconnect", undefined);
        delete WebSocketManager.#websockets[socket];
    }
}

//like express
//the websocket opening handshake is handled elsewhere
class Server {
    static #paths = {};

    static genericdothething(method, path, callback) {
        if(!this.#paths[path]) {
            this.#paths[path] = {};
        }
        this.#paths[path][method] = callback;
    }

    static get(path, callback) {
        this.genericdothething("GET", path, callback);
        //this.#paths[path] = callback;
    }

    static request(socket, request) {
        if(!this.#paths[request.path]?.[request.method]) { //if nobody is listening to this event then we'll just return (otherwise you get a TypeError lol)
            return new http_response(socket).setStatus(404).send(); //fuck yes i KNEW making setStatus return itself was a good call (method chaining!)
        }
        //this.#events[event](this.#eventListeners[event], extra);
        const response = new http_response(socket);
        return this.#paths[request.path][request.method](request, response);
        //return response.send();
    }
}

class socket_info {
    constructor(clientl) {
        this.clientl = clientl;
        this.writable = false;
        this.http_request = false;
        this.request = undefined;
        this.websocket = false;
        this.payload = undefined;
    }

    parseHttpRequest(content) {
        this.request = http_request.parse(content);
        if(this.request.headers.Upgrade == "websocket") {
            this.websocket = true;
        }else {
            this.http_request = true;
        }
        this.writable = true;
    }

    write(payload) {
        this.writable = true;
        this.payload = payload;
    }

    Drop(socket) {
        if(this.websocket) {
            WebSocketManager.disconnect(socket);
        }
        //return this;
    }
}

WebSocketManager.on("connection", function(socket) {
    print("hello websocket!",socket.socket);

    socket.on("message", function(msg) {
        print("Socket", socket.socket, "says \""+msg+"\"");
        if(msg == "!ping") {
            socket.emit("pong!");
        }
    });
    socket.on("disconnect", function() {
        print("bye bye websocket...", socket.socket);
    });
});

//ahhh just like good old nodejs express
Server.get("/", function(req, res) {
    return res.sendFile(__dirname + "/"); //this doesn't work yet lol hold on
});

while(!GetKey(VK_ESCAPE)) {
    //hmm i need to copy...
    const read_fds = FD_COPY(master_set); //custom function for copying lol
    //const write_fds = FD_COPY(master_set); //custom function for copying lol
    const write_fds = new fd_set();
    for(let i = 0; i < master_set.count; i++) {
        const socket = master_set[i];
        if(socket == listening) continue;
        if(sockaddr_map[socket].writable) {
            FD_SET(socket, write_fds);
        }
    }
    print("waiting...");
    const status = select(0, read_fds, write_fds, NULL, NULL);
    if(status == SOCKET_ERROR) {
        free(read_fds);
        free(write_fds);
        break;
    }

    print("status:",status);
    print("read_fds:",read_fds._ptr);
    print("write_fds:",write_fds._ptr);

    //__debugbreak();

    let j = 0;

    for(let i = 0; i < FD_SETSIZE; i++) {
        const socket = master_set[i];
        if(FD_ISSET(socket, read_fds)) {
            if(socket == listening) {
                const clientl = {};
                
                const clientSocket = accept(listening, clientl);

                let info;

                sockaddr_map[clientSocket] = new socket_info(clientl);

                if(info = getnameinfo(clientl)) {
                    print(info.host + " connected with port " + info.service);
                }else {
                    print(inet_ntop(AF_INET, clientl.sin_addr) + " connected with port " + ntohs(clientl.sin_port));
                }

                //if(ioctlsocket(clientSocket, FIONBIO, 0) == SOCKET_ERROR) {
                //    const err = WSAGetLastError();
                //    printNoHighlight("<ioctlsocket FIONBIO failed?> (" + _com_error(err) + ") [" + err + "]");
                //}

                FD_SET(clientSocket, master_set);
            }else {
                //print("Socket", socket, "(",i,") is ready to be read!");
                let content = "";

                let res;
                print("recv before");
                if((res = recv(socket, 4096, 0)) <= 0) {
                    if(res == SOCKET_ERROR) {
                        const err = WSAGetLastError();
                        printNoHighlight("recv failed?> (" + _com_error(err) + ") [" + err + "]");
                        if(err == WSAEWOULDBLOCK) {
                            printNoHighlight("skipping because would block");
                            break;
                        }
                    }else {
                        print("socket hung up...");
                    }
                    del_socket(socket);
                }else {
                    //<clientl>nigga what the fuck!</clientl> //sum jsx in here
                    content += String.fromCharCode(...res); //not a great solution if receiving wstrings lol
                    print(content);

                    const info = sockaddr_map[socket];

                    if(content.substring(0, content.indexOf("\n")).includes("HTTP")) { //assuming content is the whole thing (hopefully)
                        info.parseHttpRequest(content);
                    }else {
                        if(info.websocket) {
                            //welp we're not using res after this anyways so we'll transfer the array buffer to a Uint8Array
                            WebSocketManager.collectMessage(socket, new Uint8Array(res.buffer.transfer()));
                        }else {
                            SetForegroundWindow(GetConsoleWindow());
                            try {
                                print(eval(getline("Content was not an http request (what should we do chief): ")));
                            }catch(e) {
                                print(e.toString());
                            }
                            //SetForegroundWindow(hwnd);
                        }
                    }
                }
                print("recv after");

            }
            j++;
        }else if(FD_ISSET(socket, write_fds)) {
            if(socket == listening) { //what would this mean lol
                printNoHighlight("listening socket ready to write???");
            }else {
                print("ready to write to socket", socket, "(",i,")");

                const info = sockaddr_map[socket];

                let closed = false;

                if(info.http_request) {
                    if(!Server.request(socket, info.request)) { //if not closed, don't write again (unless it asks again)
                        info.writable = false;
                    }

                    /*const response = new http_response(socket);
                    response.setHeader("Content-Type", "text/html");
                    response.setHeader("Connection", "close");

                    if(info.request.method == "GET") {
                        switch(info.request.path) {
                            case "/":
                                hits++;

                                response.write(`<!DOCTYPE html>
<html lang="en-US">
<head>
</head>
<body>
<h1>
hello from my <span style="filter: blur(1px); text-shadow: 0 0 8px black; color: yellow;">jbs/c++</span> webserver!
</h1>
<p>
${hits} hit${hits > 1 ? "s" : ""}
</p>
</body>
</html>`);
                                break;
                            default:
                                response.setStatus(404);
                                break;
                        }

                        //const split = html.split("\n");
                        ////split[2] += html.length + (html.length);
                        //const len = html.length;
                        //const calc = (len + (len.toString().length));
                        //if(len.toString().length < calc.toString().length) {
                        //   calc += calc.toString().length - len.toString().length;
                        //}
                        //split[2] += calc; //content length is at index 2uah
                        //const result = split.join("\n");
                        //print(result);

                        //ohhh content length is message body only i calculated allat for nuttin
                        //const result = header+body;
                        
                        //const result = response.toString();
                        closed = response.send();
                        if(!closed) {
                            info.writable = false; //yeah we don't need to write to it anymore if it's just a regular request
                        }
                    }*/

                    //print("sent:", send(socket, html, true, 0), "out of", html.length);
                }else if(info.websocket) {
                    if(!info.payload) {
                        const response = new http_response(socket);
                        if(info.request.path == "/") {
                            response.setStatus(101); //switching protocols
                            response.setHeader("Upgrade", "websocket");
                            response.setHeader("Connection", "Upgrade");
                            //let acceptKey = btoa(SHA1.hex(info.request.headers["Sec-WebSocket-Key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"));
                            //oh wait nevermind it's SHA1.b64
                            
                            const acceptKey = SHA1.b64(info.request.headers["Sec-WebSocket-Key"] + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"); //https://datatracker.ietf.org/doc/html/rfc6455#section-4.2.2
                            response.setHeader("Sec-WebSocket-Accept", acceptKey);
                        }else {
                            response.setStatus(404);
                        }
                        
                        closed = response.send();
                        if(!closed) {
                            info.writable = false;
                            WebSocketManager.connect(socket);
                        }
                    }else {
                        closed = actually_send_all_the_data_for_me_kthxbai(socket, info.payload);
                        if(!closed) {
                            info.writable = false;
                            info.payload = undefined;
                        }
                    }
                }

//                hits++;
//
//                const body =
//`<!DOCTYPE html>
//<html lang="en-US">
//<head>
//</head>
//<body>
//<h1>
//hello from my <span style="filter: blur(1px); text-shadow: 0 0 8px black; color: yellow;">jbs/c++</span> webserver!
//</h1>
//<p>
//${hits} hit${hits > 1 ? "s" : ""}
//</p>
//</body>
//</html>`;
//
//                const header = 
//`HTTP/1.1 200 OK
//Content-Type: text/html
//Content-Length: ${body.length}
//Connection: close
//
//`
            }
            j++;
        }
        if(j == status) {
            break;
        }
    }

    free(read_fds);
    free(write_fds);
}

for(let i = 0; i < master_set.count; i++) {
    del_socket(master_set[i]);
}

free(master_set);

print(closesocket(listening));
print(WSACleanup());