//felt like doing this the hard way and read the spec to learn how to parse midi files and it mostly works
//https://www.music.mcgill.ca/~ich/classes/mumt306/midiformat.pdf
//https://ericjknapp.com/2019/09/26/midi-events/
//https://people.carleton.edu/~jellinge/m108f13/pages/04/04StandardMIDIFiles.html#:~:text=There%20are%20three%20types%20of%20track%20events%3A%201,event.%203%20Sysex%20Event%20-%20System%20Exclusive%20messages.

(function(filename) {
    let midi = require("fs").readBinary(filename);//`${__dirname}/test5(60bpm).mid`);

    let headerData = [];
    let headerLength;
    let trackData = [];

    //let format;
    //let numtracks;

    headerLength = parseInt(`0x${midi[4]}${midi[5]}${midi[6]}${midi[7]}`, 16);

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

    let divisions;
    let tempo;
    let realNotes = [];
    let readNotes = false;

    for(let i = 1; i < midi.byteLength; i++) {
        if(midi[i-1] == 77 && midi[i] == 84) { //new chunk
            if(midi[i+1] == 104 && midi[i+2] == 100) { //header
                headerLength = parseInt(`0x${midi[i+3].toString(16)}${midi[i+4].toString(16)}${midi[i+5].toString(16)}${midi[i+6].toString(16)}`, 16);
                for(let j = i+7; j < i+7+headerLength; j+=2) {
                    //print(midi[j], midi[j+1]);
                    headerData.push(parseInt(`0x${midi[j].toString(16)}${midi[j+1].toString(16)}`, 16));
                }
                divisions = headerData[2];
            }else if(midi[i+1] == 114 && midi[i+2] == 107){ //track
                let track = {length: parseInt(`0x${midi[i+3].toString(16)}${midi[i+4].toString(16)}${midi[i+5].toString(16)}${midi[i+6].toString(16)}`, 16), data: [], events: [], notes: []};
                for(let j = i+7; j < i+7+track.length; j++) {
                    let hex = midi[j].toString(16).toUpperCase();
                    track.data.push(hex.length == 1 ? "0"+hex : hex);
                }
                for(let j = 0; j < track.data.length; j++) {
                    const data = track.data[j];
                    if(data == "FF") {
                        let event = [];
                        for(let k = j-1; k < track.data.indexOf("00", j); k++) {
                            event.push(track.data[k]);
                        }
                        track.events.push(event);

                        if(track.data[j+1] == "51") {
                            let len = parseInt(track.data[j+2], 16);
                            let str = "0x";
                            for(let k = 0; k < len; k++) {
                                str += track.data[j+3+k];
                            }
                            print(str, parseInt(str, 16));
                            tempo = (1000000*60)/parseInt(str, 16); //https://people.carleton.edu/~jellinge/m108f13/pages/04/04StandardMIDIFiles.html#:~:text=0%20%3D%20major%20key-,Tempo%20Meta%20Event,-Byte%201
                        } //handle FF 03 event because it's fucking up on the beach at night (i'd include the midi file im talking about in jbs but im not gonna lie i have no idea where i got it (maybe i converted the starbound *.abc to midi somehow but that was a long time ago (apparently august 28th 2022)))
                    }else if((data[0] == "8" || data[0] == "9") && track.data[j-1] == "00" && !readNotes) {
                        readNotes = true;
                        let elapsedTime = 0;
                        const stuff = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                        let holdingNotes = [];
                        //let releasedNotes = [];
                        for(let k = j-1; k < track.data.indexOf("FF", j); k+=4) {
                            //track.notes.push(track.data[k]);
                            let note = [track.data[k], track.data[k+1], track.data[k+2], track.data[k+3]]; //note[0] is deltatime, note[1] is the midi event, note[2] is the midi key, note[3] is the velocity
                            elapsedTime += (parseInt(note[0], 16)/divisions)*(60/tempo)*(1000); //deltatime in milliseconds
                            //print(elapsedTime);
                            if(note[1][0] == "9") {
                                let key = parseInt(note[2], 16);
                                print(`hit ${stuff[key%12]}${Math.floor(key/12)} at ${elapsedTime}ms in`);
                                //holdingNotes.push({key, startTime: elapsedTime});
                                holdingNotes[key] = elapsedTime;
                            }else if(note[1][0] == "8") {
                                let key = parseInt(note[2], 16);
                                realNotes.push({key, duration: elapsedTime-holdingNotes[key], start: holdingNotes[key], beats: /*parseInt(note[0], 16)/divisions*/(elapsedTime-holdingNotes[key])/(60000/tempo)}); //x 500 tempo 60 = .5
                                delete holdingNotes[key];
                                print(`released ${stuff[key%12]}${Math.floor(key/12)} after ${(parseInt(note[0], 16)/divisions)*(60/tempo)*(1000)} ms`);
                            }
                        }
                    }
                }
                trackData.push(track);
            }
        }
    }

    print(/*headerLength, headerData, trackData, */divisions, tempo);//, realNotes);

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