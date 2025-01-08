//felt like doing this the hard way and read the spec to learn how to parse midi files and it mostly works
//https://www.music.mcgill.ca/~ich/classes/mumt306/midiformat.pdf
//https://ericjknapp.com/2019/09/26/midi-events/
//https://people.carleton.edu/~jellinge/m108f13/pages/04/04StandardMIDIFiles.html#:~:text=There%20are%20three%20types%20of%20track%20events%3A%201,event.%203%20Sysex%20Event%20-%20System%20Exclusive%20messages.
//https://www.ccarh.org/courses/253/handout/vlv/
//http://midi.teragonaudio.com/tech/midifile/vari.htm
//https://sites.uci.edu/camp2014/2014/05/19/timing-in-midi-files/
//filename = showOpenFilePicker({multiple: false,
//    excludeAcceptAllOption: true,
//    types: [
//        {
//            description: "MIDI files",
//            accept: [".midi", ".mid"] //i can't be bothered to implement the mime types :sob:
//        }
//    ]
//})[0];//`${__dirname}/test5(60bpm).mid`;
(function(filename) {
    const funprints = false; //printing these messages is lowkey the slowest part

    let midi = require("fs").readBinary(filename);//`${__dirname}/test5(60bpm).mid`);

    let headerData = [];
    let headerLength;
    let trackData = [];
    const musicnotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    //let format;
    //let numtracks;

    //headerLength = parseInt(`0x${midi[4]}${midi[5]}${midi[6]}${midi[7]}`, 16);
    headerLength = Number(BigInt(midi[4]) << 32n | BigInt(midi[5]) << 16n | BigInt(midi[6]) << 8n | BigInt(midi[7]));
    
    //for(let i = 8; i < 8+headerLength; i++) {
    //    headerData.push(midi[i]);
    //    if(i % 2 == 1) {
    //        if(!format) {
    //            format = midi[i];
    //        }else if(!numtracks) {
    //            numtracks = midi[i];
    //        }
    //    }
    //}

    function snip(i) {
        return i & (~0b10000000); //bitwise AND after i flip the bits of 128 to remove the 8th bit from i (because variable deltatime's values are represented with only 7 bits)
    }

    function elapse(time) {
        elapsedTime += (parseInt(time, 16)/divisions)*(60/tempo)*(1000); //deltatime in milliseconds
        //if(tempos?.length && elapsedTime > tempos[0][1]) {
        //    tempo = tempos[0][0];
        //    tempos.splice(0, 1);
        //}
        funprints && print("elapsed", (parseInt(time, 16)/divisions)*(60/tempo)*(1000), "ms");
    }

    function parseEvent(event) {
        event = event.map((e) => (e.toString(16).length == 1 ? "0"+e.toString(16) : e.toString(16)).toUpperCase());
        elapse(event[0]);
        //print(event);
        if(event[2] == "51") {
            let str = "0x";
            for(let i = 4; i < event.length; i++) {
                str += event[i];
            }
            //print(str, parseInt(str, 16));
            tempo = (1000000*60)/parseInt(str, 16); //https://people.carleton.edu/~jellinge/m108f13/pages/04/04StandardMIDIFiles.html#:~:text=0%20%3D%20major%20key-,Tempo%20Meta%20Event,-Byte%201
            //tempos.push([tempo, elapsedTime]);
            //temposCopy.push([tempo, elapsedTime]);
            print(`tempo now ${tempo} at ${elapsedTime} ms in`);
        } //handle FF 03 event because it's fucking up on the beach at night (i'd include the midi file im talking about in jbs but im not gonna lie i have no idea where i got it (maybe i converted the starbound *.abc to midi somehow but that was a long time ago (apparently august 28th 2022))) (NOPE WHAT ACTUALLY HAPPENED IS I FOUND IT IN THE DESCRIPTION OF A RANDOM VIDEO! https://www.youtube.com/watch?v=cyxmIXhihg8) 
        else if(event[2] == "01" || event[2] == "02" || event[2] == "03") {
            let str = "";
            for(let i = 4; i < event.length; i++) { //skip past all the other info
                str += String.fromCharCode(parseInt(event[i], 16));
            }
            eventstr = {"01": "text event ->", "02": "copyright", "03": "name ->", "04": "is using instrument", "05": ""} //oh shoot 03 is actually the track name 04 is the instrument (why is fl studio doing it like that)
            print(`track ${currentTrackNumber} ${eventstr[event[2]]} ${str}`);
        }else if(event[2] == "58") {
            print("ignoring time signature event because idk how to handle allathat (basically assuming 4/4 idk)");
        }else if(event[2] == "2F") {
            print(`reached track end event of track ${currentTrackNumber}`);
            readingTrack = false;
            elapsedTime = 0;
            //tempos = Array.from(temposCopy); //i think Array.from is shallow but im not modifying the lower arrays lol
        }
    }

    function parseNotes() {
        //midinote = midinote.map((e) => (e.toString(16).length == 1 ? "0"+e.toString(16) : e.toString(16)).toUpperCase());
        //print(midinote);
        let time = midinote[0];
        //let i = 0; //wait why do i use i here but j in readmidigui.js ?
        if(midinote[0].length > 2) {
            //time = midinote[0]+midinote[1]; //aw damn it bruh this shit does NOT work the same way one byte deltatime works (AW FUCK I JUST LEARNED THAT DELTATIME COULD BE 4 BYTES)
            //i = 1;
            print("variable deltatime moment",time,midinote.join(" "));
            //let binary = parseInt(time, 16).toString(2).split("");
            //binary.splice(0, 1);
            //binary.splice(7, 1);
            ////https://www.ccarh.org/courses/253/handout/vlv/
            ////http://midi.teragonaudio.com/tech/midifile/vari.htm
            //elapsedTime += (parseInt(binary.join(""), 2)/divisions)*(60/tempo)*(1000);//(60000/(tempo * parseInt(time, 16)));
            //print("special elapsed", (parseInt(binary.join(""), 2)/divisions)*(60/tempo)*(1000), "ms");

            let timeasint = 0;

            //alright i changed midinote when you call parseNotes and midinote[0] is the deltatime 
            const deltahexi = midinote[0].match(/([A-F0-9]{2})/g); //midinote[0].split() //shoot split works kinda weird so i don't think you can split a string every n characters like that (but guess what the google said i should use instead :troll:)
            for(let k = 0; k < deltahexi.length; k++) {
                //globalThis?.midinote?.[0]?.skibidi?.(); //as careful as possible
                timeasint |= snip(parseInt(deltahexi[k], 16)) << ((deltahexi.length-(k+1))*7); //math checks out (in my head that is)
            }
    
            elapsedTime += (timeasint/divisions)*(60/tempo)*(1000);
            funprints && print("special elapsed", (timeasint/divisions)*(60/tempo)*(1000), "ms!");    
        }else {
            //time = midinote[0];
            elapse(time);
        }
        const notedata = midinote[2].match(/([A-F0-9]{2})/g);
        const key = parseInt(notedata[0], 16);
        if(midinote[1][0] == "9") { //if the second byte of midinote starts with 9 it's a note on event
            const vel = parseInt(notedata[1], 16);
            funprints && print(`hit ${musicnotes[key%12]}${Math.floor(key/12)} at ${elapsedTime}ms in (${vel} velocity)`);
            holdingNotes[key] = {time: elapsedTime, vel};
        }else if(midinote[1][0] == "8") { //if the second byte of midinote starts with 8 it's a note off event
            //let key = parseInt(notedata[0], 16);
            if(holdingNotes[key] == undefined) { //bruh i had this as !holdingNotes[key] and it falsely accused the first note of being a glitch
                print(`not holding key but released anyways? (${key} -> ${musicnotes[key%12]}${Math.floor(key/12)})`);
            }else {
                //print(midinote[i+3]);
                realNotes.push({key, duration: elapsedTime-holdingNotes[key].time, start: holdingNotes[key].time, beats: /*parseInt(note[0], 16)/divisions*/(elapsedTime-holdingNotes[key].time)/(60000/tempo), channel: parseInt(midinote[1][1], 16), vel: holdingNotes[key].vel}); //x 500 tempo 60 = .5
                //key == 0 && print(midinote, "midinote"); //uh one of my test midis is kinda weird and keeps "releasing" a key that wasn't pressed
                delete holdingNotes[key];
                funprints && print(`released ${musicnotes[key%12]}${Math.floor(key/12)} after ${(parseInt(time, 16)/divisions)*(60/tempo)*(1000)} ms`);
            }
        }
                //        //let releasedNotes = [];
                //        for(let k = j-1; k < track.data.indexOf("FF", j); k+=4) {
                //            //track.notes.push(track.data[k]);
                //            let note = [track.data[k], track.data[k+1], track.data[k+2], track.data[k+3]]; //note[0] is deltatime, note[1] is the midi event, note[2] is the midi key, note[3] is the velocity
                //            elapsedTime += (parseInt(note[0], 16)/divisions)*(60/tempo)*(1000); //deltatime in milliseconds
                //            //print(elapsedTime);
                //            if(note[1][0] == "9") {
                //                let key = parseInt(note[2], 16);
                //                print(`hit ${stuff[key%12]}${Math.floor(key/12)} at ${elapsedTime}ms in`);
                //                //holdingNotes.push({key, startTime: elapsedTime});
                //                holdingNotes[key] = elapsedTime;
                //            }else if(note[1][0] == "8") {
                //                let key = parseInt(note[2], 16);
                //                realNotes.push({key, duration: elapsedTime-holdingNotes[key], start: holdingNotes[key], beats: /*parseInt(note[0], 16)/divisions*/(elapsedTime-holdingNotes[key])/(60000/tempo)}); //x 500 tempo 60 = .5
                //                delete holdingNotes[key];
                //                print(`released ${stuff[key%12]}${Math.floor(key/12)} after ${(parseInt(note[0], 16)/divisions)*(60/tempo)*(1000)} ms`);
                //            }
                //        }
        midinote = [];
    }

    let divisions;
    let tempo = 60;
    //let tempos;
    //let temposCopy = [];
    let realNotes = [];
    //let readNotes = false;
    let readingTrack = false;
    let readingTrackHeader = false;
    let readingEvent = false;
    let currentEndTrackHeader = 0;
    let currentTrackNumber = 0;
    let currentTrackStartIndex = 0;
    let currentTrackLength = 0;
    let currentEvent = [];
    let currentEventStartIndex = 0;
    let currentEventLength = 0;
    let elapsedTime = 0;
    let midinote = [];
    let holdingNotes = [];

    for(let i = 0; i < midi.byteLength; i++) {
        if(midi[i] == 77 && midi[i+1] == 84) { //new chunk
            if(midi[i+2] == 104 && midi[i+3] == 100) { //header
                //headerLength = parseInt(`0x${midi[i+4].toString(16)}${midi[i+5].toString(16)}${midi[i+6].toString(16)}${midi[i+7].toString(16)}`, 16);
                headerLength = Number(BigInt(midi[i+4]) << 32n | BigInt(midi[i+5]) << 16n | BigInt(midi[i+6]) << 8n | BigInt(midi[i+7]));
                for(let j = i+8; j < i+8+headerLength; j+=2) {
                    //print(midi[j], midi[j+1]);
                    //headerData.push(parseInt(`0x${midi[j].toString(16)}${midi[j+1].toString(16)}`, 16));
                    headerData.push(midi[j] << 8 | midi[j+1]);
                }
                print(headerData);
                print("headerData");
                divisions = headerData[2];
            }else if(midi[i+2] == 114 && midi[i+3] == 107){ //track
                readingTrack = true;
                readingTrackHeader = true;
                currentTrackNumber++;

                //noooooo i was using the lame .toString(16) which doesn't fill the second space if the number is less than 16 (so 14 .toString(16) == "e" instead of "0e")
                //i tawlk more about it in readmidigui.js
                //currentTrackLength = parseInt(`0x${midi[i+4].toString(16)}${midi[i+5].toString(16)}${midi[i+6].toString(16)}${midi[i+7].toString(16)}`, 16);

                currentTrackLength = Number(BigInt(midi[i+4]) << 32n | BigInt(midi[i+5]) << 16n | BigInt(midi[i+6]) << 8n | BigInt(midi[i+7])); //the n suffix is for bigint :)
                    
                print(`track ${currentTrackNumber} is ${currentTrackLength} bytes long (apparently)`);

                currentEndTrackHeader = i+7;
                currentTrackStartIndex = currentEndTrackHeader+1;
                //let track = {length: parseInt(`0x${midi[i+3].toString(16)}${midi[i+4].toString(16)}${midi[i+5].toString(16)}${midi[i+6].toString(16)}`, 16), data: [], events: [], notes: []};
                //for(let j = i+7; j < i+7+track.length; j++) {
                //    let hex = midi[j].toString(16).toUpperCase();
                //    track.data.push(hex.length == 1 ? "0"+hex : hex);
                //}
                //for(let j = 0; j < track.data.length; j++) {
                //    const data = track.data[j];
                //    if(data == "FF") {
                //        let event = [];
                //        for(let k = j-1; k < track.data.indexOf("00", j); k++) {
                //            event.push(track.data[k]);
                //        }
                //        track.events.push(event);
//
                //        if(track.data[j+1] == "51") {
                //            let len = parseInt(track.data[j+2], 16);
                //            let str = "0x";
                //            for(let k = 0; k < len; k++) {
                //                str += track.data[j+3+k];
                //            }
                //            print(str, parseInt(str, 16));
                //            tempo = (1000000*60)/parseInt(str, 16); //https://people.carleton.edu/~jellinge/m108f13/pages/04/04StandardMIDIFiles.html#:~:text=0%20%3D%20major%20key-,Tempo%20Meta%20Event,-Byte%201
                //        } //handle FF 03 event because it's fucking up on the beach at night (i'd include the midi file im talking about in jbs but im not gonna lie i have no idea where i got it (maybe i converted the starbound *.abc to midi somehow but that was a long time ago (apparently august 28th 2022))) (NOPE WHAT ACTUALLY HAPPENED IS I FOUND IT IN THE DESCRIPTION OF A RANDOM VIDEO! https://www.youtube.com/watch?v=cyxmIXhihg8) 
                //    }else if((data[0] == "8" || data[0] == "9") && track.data[j-1] == "00" && !readNotes) {
                //        readNotes = true;
                //        let elapsedTime = 0;
                //        const stuff = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                //        let holdingNotes = [];
                //        //let releasedNotes = [];
                //        for(let k = j-1; k < track.data.indexOf("FF", j); k+=4) {
                //            //track.notes.push(track.data[k]);
                //            let note = [track.data[k], track.data[k+1], track.data[k+2], track.data[k+3]]; //note[0] is deltatime, note[1] is the midi event, note[2] is the midi key, note[3] is the velocity
                //            elapsedTime += (parseInt(note[0], 16)/divisions)*(60/tempo)*(1000); //deltatime in milliseconds
                //            //print(elapsedTime);
                //            if(note[1][0] == "9") {
                //                let key = parseInt(note[2], 16);
                //                print(`hit ${stuff[key%12]}${Math.floor(key/12)} at ${elapsedTime}ms in`);
                //                //holdingNotes.push({key, startTime: elapsedTime});
                //                holdingNotes[key] = elapsedTime;
                //            }else if(note[1][0] == "8") {
                //                let key = parseInt(note[2], 16);
                //                realNotes.push({key, duration: elapsedTime-holdingNotes[key], start: holdingNotes[key], beats: /*parseInt(note[0], 16)/divisions*/(elapsedTime-holdingNotes[key])/(60000/tempo)}); //x 500 tempo 60 = .5
                //                delete holdingNotes[key];
                //                print(`released ${stuff[key%12]}${Math.floor(key/12)} after ${(parseInt(note[0], 16)/divisions)*(60/tempo)*(1000)} ms`);
                //            }
                //        }
                //    }
                //}
                //trackData.push(track);
            }
        }else if(readingTrack) {
            if(readingTrackHeader) {
                if(i == currentEndTrackHeader) {
                    readingTrackHeader = false;
                }
            }else {
                if(midi[i] == 255) { //0xFF
                    readingEvent = true;
                    currentEvent = [];
                    currentEvent.push(midi[i-1]);
                    currentEvent.push(midi[i]);
                    currentEventLength = midi[i+2];
                    currentEventStartIndex = i+2;
                    //midinote keeps catching stray deltatimes from events so gotta get that outta there
                    //if(midinote.at(-1) == midi[i-1]) {
                    //    midinote.splice(-1, 1); //oh shoot i didn't know you could do negative numbers here (i only knew that they added the at function with negatives)
                    //}
                    //print(currentEvent, currentEventLength, currentEventStartIndex);
                }else if(readingEvent) {
                    currentEvent.push(midi[i]);
                    //print(i, currentEventStartIndex, i-currentEventStartIndex, currentEventLength, midi[i]);
                    if(i-currentEventStartIndex >= currentEventLength) {
                        readingEvent = false;
                        parseEvent(currentEvent);
                    }
                }else if(midi[i+1] != 255){
                    let hex = midi[i].toString(16).toUpperCase();
                    //cheeky regex i came up with /((?:[A-F0-9]{2}){1,4}?)([8-9A-E][A-F0-9])((?:[A-F0-9]{2}){2})/ (alright nevermind wrap it up guys, for this to work i'd need to already know the length of the note event)
                    //HOLD ON CLUTCH? /((?:[A-F0-9]{2}){1,4}?)([8-9A-E][A-F0-9])((?:[A-F0-7][A-F0-9]){2})/
                    
                    //print(hex.length == 1 ? "0"+hex : hex, i);
                    midinote.push(hex.length == 1 ? "0"+hex : hex);//midi[i]);
                    if(midinote.length > 2) { //wait wtf why does the 0xC and 0xD event only have a length of 3 because they don't pad it ??? (probably the same reason variable deltatime exists...)
                        //let programchangeorchannelpressure = false;
                        let results = midinote.join("").match(/((?:[A-F0-9]{2}){1,4}?)([8-9A-E][A-F0-9])((?:[A-F0-7][A-F0-9]){2})/)?.filter((v, k) => k > 0);
                        if(results) {
                            midinote = results;
                            parseNotes();
                        }//else if((midinote[1][0] == "C" || midinote[1][0] == "D") && midinote.length == 3) {
                        else if((midinote[midinote.length-2][0] == "C" || midinote[midinote.length-2][0] == "D")) { //this MAYBE could happen with deltatime but according to the examples they gave, it doesn't :)
                            //programchangeorchannelpressure = true;
                            let r2 = midinote.join("").match(/((?:[A-F0-9]{2}){1,4}?)([8-9A-E][A-F0-9])((?:[A-F0-7][A-F0-9]){1})/)?.filter((v, k) => k > 0);
                            if(r2) {
                                midinote = r2;
                                parseNotes();
                            }
                        }
                        /*if((midinote[1][0] == "C" || midinote[1][0] == "D") && midinote.length == 3) {
                            parseNotes();
                        }else if(midinote[1][0] != "8" && midinote[1][0] != "9" && midinote[1][0] != "A" && midinote[1][0] != "B" && midinote[1][0] != "C" && midinote[1][0] != "D" && midinote[1][0] != "E") {
                            //print("midinote slippage");
                            if(midinote[2][0] == "8" || midinote[2][0] == "9" || midinote[2][0] == "A" || midinote[2][0] == "B" || midinote[2][0] == "C" || midinote[2][0] == "D" || midinote[2][0] == "E") {
                                if(midinote.length == 5) {
                                    parseNotes();
                                }
                            }
                        }else if(midinote.length == 4){
                            parseNotes();
                        }*/
                        
                    }
                }
            }
            if(i-currentTrackStartIndex >= currentTrackLength) {
                readingTrack = false;
                print(`finished reading track ${currentTrackNumber}`, i);
                elapsedTime = 0;
            }
        }
    }

    funprints && print(/*headerLength, headerData, trackData, */divisions, tempo, realNotes);

    return [tempo, realNotes];

    //for(let track of trackData) {
    //    for(let i = 0; i < track.data.length; i++) {
    //        let byte = track.data[i];
    //        
    //    }
    //}
    //print([midi[0], midi[1]] == [77, 84]);

    //print(headerData);
});