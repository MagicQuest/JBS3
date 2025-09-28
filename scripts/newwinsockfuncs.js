if(Msgbox("newwinsockfuncs.js hosts a website on port 25565 -> http://localhost:25565/\n\nhold escape while connecting to shutdown the web server", "newwinsockfuncs.js", MB_OKCANCEL | MB_ICONINFORMATION | MB_SYSTEMMODAL) != IDOK) {
    quit;
}

let hits = 0;

const rngdata = WSAStartup(MAKEWORD(2, 2));
print(rngdata);

const listening = socket(AF_INET, SOCK_STREAM, 0);
print(listening);

if(listening == INVALID_SOCKET) {
    print("fuck ts invalid");
    const err = WSAGetLastError();
    print("FUCK SOMETHING WENT FUC (" + _com_error(err) + ") [" + err + "]");
    print(WSACleanup());
    quit;
}

const hint = new sockaddr_in(AF_INET, htons(25565));
print(hint, ntohs(hint.sin_port));

print(inet_pton(AF_INET, "127.0.0.1", hint.sin_addr)); //pass sin_addr "directly" instead of by & reference in c++ lool
print(hint);

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

while(!GetKey(VK_ESCAPE)) {
    let clientl = {};
    const clientSocket = accept(listening, clientl);
    let info;

    print("CLIENT:", clientSocket, clientl);

    if(info = getnameinfo(clientl)) {
        print(info.host + " connected with port " + info.service);
    }else {
        print(inet_ntop(AF_INET, clientl.sin_addr) + " connected with port " + ntohs(clientl.sin_port));
    }

    let content = "";

    let bytesAvailable;

    do {
        let bytesReceived;

        res = recv(clientSocket, 4096, 0);
        if(res == SOCKET_ERROR) {
            const err = WSAGetLastError();
            print("recv failed?> (" + _com_error(err) + ") [" + err + "]");
            break;
        }else if(res != 0) {
            bytesReceived = res.byteLength;
            //print(res);
            content += String.fromCharCode(...res);
        }else { //if res is 0, the socket has closed the connection
            break;
        }

        res = ioctlsocket(clientSocket, FIONREAD);
        if(res == SOCKET_ERROR) {
            const err = WSAGetLastError();
            print("ioctlsocket failed! (" + _com_error(err) + ") [" + err + "]");
            break;
        }else {
            bytesAvailable = res;
        }
    } while(bytesAvailable != 0);

    if(content.startsWith("GET / HTTP/1.1")) {
        print("MAIN GET REQUEST!");

        hits++;

        const html = 
`HTTP/1.1 200 OK
Content-Type: text/html

<!DOCTYPE html>
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
</html>`

        print("sent:", send(clientSocket, html, true, 0), "out of", html.length);
    }

    closesocket(clientSocket);
}

print(closesocket(listening));
print(WSACleanup());