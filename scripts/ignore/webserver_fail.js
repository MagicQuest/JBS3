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

if(ioctlsocket(listening, FIONBIO, 1) == SOCKET_ERROR) {
    const err = WSAGetLastError();
    printNoHighlight("<ioctlsocket FIONBIO failed?> (" + _com_error(err) + ") [" + err + "]");
    closesocket(listening);
    print(WSACleanup());
    quit;
}

const master_set = new fd_set();
FD_SET(listening, master_set);

const sockaddr_map = {};

//let read_fds = new fd_set();

print(listening, master_set, master_set[0]);

function del_socket(socket) {
    print("dial tone");
    closesocket(socket);
    FD_CLR(socket, master_set);
    delete sockaddr_map[socket];
}

while(!GetKey(VK_ESCAPE)) {
    let clientl = {};
    //const clientSocket = accept(listening, clientl);
    
    //hmm i need to copy...
    const read_fds = FD_COPY(master_set); //custom function for copying lol
    const write_fds = FD_COPY(master_set); //custom function for copying lol
    
    const status = select(0, read_fds, write_fds, NULL, NULL);
    if(status == SOCKET_ERROR) {
        free(read_fds);
        free(write_fds);
        break;
    }

    //for(let i = 0; i < FD_SETSIZE; i++) {
    //    if(FD_ISSET(i, read_fds)) {
    //        
    //    }
    //}

    print("status:",status);

    //if you call FD_CLR while iterating it will skip one like a normal array would lol
    //the fd_set object is not iterable because idk how i would do that on the cpp side lol
    for(let i = 0; i < FD_SETSIZE; i++) {
        const socket = read_fds[i];
        if(!FD_ISSET(socket, read_fds)) {
            // print("aw that shit (index:",i,") was NOT set in read_fds");
            continue;
        }
        print("socket",socket,"at",i);
        if(socket == listening) {
            const clientSocket = accept(listening, clientl);

            sockaddr_map[clientSocket] = {clientl, awaiting_response: undefined};

            let info;

            print("CLIENT:", clientSocket); //, clientl);

            if(info = getnameinfo(clientl)) {
                print(info.host + " connected with port " + info.service);
            }else {
                print(inet_ntop(AF_INET, clientl.sin_addr) + " connected with port " + ntohs(clientl.sin_port));
            }

            FD_SET(clientSocket, master_set);

            if(ioctlsocket(clientSocket, FIONBIO, 1) == SOCKET_ERROR) {
                const err = WSAGetLastError();
                printNoHighlight("<ioctlsocket FIONBIO failed?> (" + _com_error(err) + ") [" + err + "]");
                del_socket(clientSocket);
                continue;
            }

            //closesocket(clientSocket);
            //print("socket closed!");
        }else {
            //client data ;)
            
            //if(sockaddr_map[socket].awaitinghtml) { //ok it seems like this doesn't happen FUCK (OHHHHH IM SUPPOSED TO CHECK IF IT'S WRITEABLE)
            //    print("sending html!");
            //}else {
            print("client data:");
                
            let content = "";

            //let bytesAvailable;

                //let fucked = false;

                //do {
                //    let bytesReceived;
                //
                //    res = recv(socket, 4096, 0);
                //    if(res == SOCKET_ERROR) {
                //        const err = WSAGetLastError();
                //        print("recv failed?> (" + _com_error(err) + ") [" + err + "]");
                //        fucked = true;
                //        break;
                //    }else if(res != 0) {
                //        bytesReceived = res.byteLength;
                //        //print(res);
                //        content += String.fromCharCode(...res);
                //    }else { //if res is 0, the socket has closed the connection
                //        print("socket hung up... (dial tone)");
                //        fucked = true;
                //        break;
                //    }
                //
                //    res = ioctlsocket(socket, FIONREAD);
                //    if(res == SOCKET_ERROR) {
                //        const err = WSAGetLastError();
                //        print("ioctlsocket failed! (" + _com_error(err) + ") [" + err + "]");
                //        break;
                //    }else {
                //        bytesAvailable = res;
                //    }
                //} while(bytesAvailable != 0);

                //if(fucked) {
                //    print("bye byte", socket);
                //    closesocket(socket);
                //    FD_CLR(socket, master_set);
            //}

            let res;
            print("recv before");
            if((res = recv(socket, 4096, 0)) <= 0) {
                if(res == SOCKET_ERROR) {
                    const err = WSAGetLastError();
                    printNoHighlight("recv failed?> (" + _com_error(err) + ") [" + err + "]");
                    if(err == WSAEWOULDBLOCK) {
                        print("skipping because would block");
                        break;
                    }
                }else {
                    print("socket hung up...");
                }
                del_socket(socket);
            }else {
                //<clientl>nigga what the fuck!</clientl> //sum jsx in here
                content += String.fromCharCode(...res); //not a great solution if receiving wstrings lol
            }
            print("recv after");

            print(content);

            if(content.startsWith("GET")) {
                const line = content.substring(0, content.indexOf("\n")).split(" ");
                sockaddr_map[socket].awaiting_response = line[1];
                print(`GET'ing '${line[1]}'!`);
            }

            // if(content.startsWith("GET / HTTP/1.1")) {
                // print("MAIN GET REQUEST!");

                //sockaddr_map[socket].awaitinghtml = true;
            // }
                
            //}
        }
    }

    free(read_fds);
    free(write_fds);

    //for(let i = 0; i < FD_SETSIZE; i++) {
    //    const socket = write_fds[i];
    //    if(!FD_ISSET(socket, write_fds)) {
    //        //print("aw that shit (index:",i,") was NOT set in write_fds");
    //        continue;
    //    }
    //    if(socket == listening) { //what would this mean lol
    //        printNoHighlight("listening socket ready to write???");
    //    }else {
    //        if(!sockaddr_map[socket]) { //the socket may have been closed earlier!
    //            continue;
    //        }
    //        switch(sockaddr_map[socket].awaiting_response) {
    //            case "/": {
    //                print("MAIN GET REQUEST!");
    //
    //                hits++;
    //
    //                const html = 
    //                `HTTP/1.1 200 OK
    //                Content-Type: text/html
    //
    //                <!DOCTYPE html>
    //                <html lang="en-US">
    //                <head>
    //                </head>
    //                <body>
    //                <h1>
    //                hello from my <span style="filter: blur(1px); text-shadow: 0 0 8px black; color: yellow;">jbs/c++</span> webserver!
    //                </h1>
    //                <p>
    //                ${hits} hit${hits > 1 ? "s" : ""}
    //                </p>
    //                </body>
    //                </html>`;
    //
    //                const dry = send(socket, html, true, 0);
    //
    //                if(dry != html.length) {
    //                    print("aw FUCK it didn't send all the data:", dry, "<", html.length);
    //                    const len = html.length-dry;
    //                    let total = dry;
    //                    let bytesleft = len;
    //                    let n;
    //                    while(total < len) {
    //                        n = send(socket, html.substring(total), true, 0);
    //                        print("n:",n,"(",socket,")");
    //                        if(n == SOCKET_ERROR) {
    //                            const err = WSAGetLastError();
    //                            printNoHighlight("<send failed?> (" + _com_error(err) + ") [" + err + "]");
    //                            //del_socket(socket);
    //                            break;
    //                        }
    //                        total += n;
    //                        bytesleft -= n;
    //                        print("new total:", total,"bytesleft:",bytesleft);
    //                    }
    //                }
    //                break;
    //            }
    //            default:
    //                print("i don't got",sockaddr_map[socket].awaiting_response,".");
    //                break;
    //        }
    //        sockaddr_map[socket].awaiting_response = undefined;
    //    }
    //}
}

for(let i = 0; i < master_set.count; i++) {
    del_socket(master_set[i]);
}

free(master_set);

print(closesocket(listening));
print(WSACleanup());