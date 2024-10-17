//lowkey the reason why im not adding fluidsynth is because it LOWKEY has too many dependancies and im not rebuilding all of glib and whatnot
//oh shoot fluidsynth can read midi (im not using that shit tho i already made my own bruh fuck nah)

//SetDllDirectory(__dirname+"\\");
//const cookie = AddDllDirectory(__dirname+"\\");

//print(__dirname+"\\libfluidsynth-3.dll");

//                  aw shit if you use the forward slash it won't work!!!
const fluidsynth = DllLoad(__dirname+"\\libfluidsynth-3.dll", LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_SYSTEM32); //aw damn i had to use procmon to figure out why this wasn't working and it was because it was looking for system32's DSOUND.dll in this directory (i had only specified LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR)

print(fluidsynth("fluid_version_str", 0, [], [], RETURN_CSTRING));

function cleanup(settings, synth, adriver) {
    print(fluidsynth("delete_fluid_audio_driver", 1, [adriver], [VAR_INT], RETURN_VOID)); //oops these should be void but i don't really have a thing for that
    print(fluidsynth("delete_fluid_synth", 1, [synth], [VAR_INT], RETURN_VOID)); //oops these should be void but i don't really have a thing for that
    print(fluidsynth("delete_fluid_settings", 1, [settings], [VAR_INT], RETURN_VOID)); //oops these should be void but i don't really have a thing for that
    quit; //can't return the whole program so im lowkey gonna error
}

const settings_ptr = fluidsynth("new_fluid_settings", 0, [], [], RETURN_NUMBER);
if(settings_ptr == NULL) {
    print("Failed to create the settings!");
    cleanup(settings_ptr, NULL, NULL);
}

const synth_ptr = fluidsynth("new_fluid_synth", 1, [settings_ptr], [VAR_INT], RETURN_NUMBER);
if(synth_ptr == NULL) {
    print("Failed to create the synth!");
    cleanup(settings_ptr, synth_ptr, NULL);
}

const sfont_id = fluidsynth("fluid_synth_sfload", 3, [synth_ptr, __dirname+"/TimGM6mb.sf2", 1], [VAR_INT, VAR_CSTRING, VAR_INT], RETURN_NUMBER);
if(sfont_id == -1) { //FLUID_FAILED
    print("Loading the SoundFont failed!");
    cleanup(settings_ptr, synth_ptr, NULL);
}

const sfont = fluidsynth("fluid_synth_get_sfont_by_id", 2, [synth_ptr, sfont_id], [VAR_INT, VAR_INT], RETURN_NUMBER);
if(sfont != NULL) {
    //fluid_preset_t *preset;
    //fluid_sfont_iteration_start(sfont);
    //while ((preset = fluid_sfont_iteration_next(sfont)) != NULL) {
    //    int bank = fluid_preset_get_banknum(preset);
    //    int prog = fluid_preset_get_num(preset);
    //    const char* name = fluid_preset_get_name(preset);
    //    printf("bank: %d prog: %d name: %s\n", bank, prog, name);
    //}
    fluidsynth("fluid_sfont_iteration_start", 1, [sfont], [VAR_INT], RETURN_VOID);
    while((preset = fluidsynth("fluid_sfont_iteration_next", 1, [sfont], [VAR_INT], RETURN_NUMBER)) != NULL) { //oops had that shit as RETURN_VOID and libffi did NOT like that
        const bank = fluidsynth("fluid_preset_get_banknum", 1, [preset], [VAR_INT], RETURN_NUMBER);
        const prog = fluidsynth("fluid_preset_get_num", 1, [preset], [VAR_INT], RETURN_NUMBER);
        const name = fluidsynth("fluid_preset_get_name", 1, [preset], [VAR_INT], RETURN_CSTRING); //lol this helped me realize that i didn't test returning strings with libffi and i had to fix it
        print(`bank: ${bank} prog: ${prog} name: ${name}`);
    }
    print("done");
}

//                              wait wtf inputbox is the only way to get text from the user without a window! (just realized i never added like a get console line or cin) ok i just adde dgetline
fluidsynth("fluid_synth_program_select", 5, [synth_ptr, 0, sfont_id, ...[getline("Choose the bank: "), getline("Preset (prog) num: ")]], [VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER);

const adriver_ptr = fluidsynth("new_fluid_audio_driver", 2, [settings_ptr, synth_ptr], [VAR_INT, VAR_INT], RETURN_NUMBER);
if(adriver_ptr == NULL) {
    print("Failed to create the audio driver!");
    cleanup(settings_ptr, synth_ptr, adriver_ptr);
}

//print(settings_ptr);

for (i = 0; i < 120; i++)
{
    /* Generate a random key */
    const key = 60 + Math.round(Math.random()*12);

    /* Play a note */
    //fluid_synth_noteon(synth, 0, key, 80);
    fluidsynth("fluid_synth_noteon", 4, [synth_ptr, 0, key, 100], [VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER); //synth, channel, key, velocity

    /* Sleep for 1 second */
    Sleep(50);

    /* Stop the note */
    //fluid_synth_noteoff(synth, 0, key);
    fluidsynth("fluid_synth_noteoff", 3, [synth_ptr, 0, key], [VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER); //synth, channel, key
}

cleanup(settings_ptr, synth_ptr, adriver_ptr);
//print(RemoveDllDirectory(cookie), " == 1");