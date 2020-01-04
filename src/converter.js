const fs = require('fs');
const readline = require('readline');
const { clipboard, app, shell } = require('electron');
const xml_js = require('xml-js');
const arrayMove = require('array-move');
const storage = require('electron-json-storage');
const remote = require('electron').remote;
const mm = require('music-metadata');
const util = require('util');
const path = require('path');
const process = require('process');
const firstline = require('firstline');

// array to store all tracks in
var tracks = [];
var settings = {};
// saves the id/counter of the track that is currently being edited
var is_editing, is_adding, is_add_above, is_add_below;
var scroll_pos;

//boolean whether rekordbox should be monitored or not
var is_monitoring = true;
var rekordbox_path = process.env.APPDATA + path.sep + "Pioneer" + path.sep + "rekordbox" + path.sep + "beatport" + path.sep;

//rekordbox_path;
// var temp = fs.readdirSync(rekordbox_path, function (err, items) {
//     if (err) {
//         console.log(err)
//     }
//     console.log(items);
//     items.forEach(element => {
//         if (fs.statSync(rekordbox_path += element).isDirectory()) {
//             console.log("DIRECTORY:" + element);
//         }
//         console.log(element);
//     });
// });
var temp = fs.readdirSync(rekordbox_path);

rekordbox_path += temp[0]

rekordbox_path += path.sep + "tr";
//console.log(rekordbox_path);
monitor_rekordbox(rekordbox_path);
// save the state of adding a track, necessary because add and edit share the same save function
// load settings file or create it
try {
    settings_load();
}
catch {
    settings_reset();
}
// load settings from settings file into the settings menu
function settings_load() {
    // check if settings file exists / create it if it doesn't exist
    fs.access(storage.getDataPath('settings'), (err) => {
        if (err) {
            settings_reset();
        }
        // load settings
        storage.get('settings', function(err, data) {
            if (err) throw error;
            settings = data;
            // populate settings form
            document.getElementById('settings_promo_input').value = settings.promo;
            document.getElementById('settings_ignore_switch').checked = settings.ignore.switch;
            document.getElementById('settings_ignore_input').value = settings.ignore.keywords;
            document.getElementById('settings_omit_switch').checked = settings.omit.switch;
            document.getElementById('settings_omit_input').value = settings.omit.keywords;
            document.getElementById('settings_syntax_fixer_switch').checked = settings.syntax.switch;
            document.getElementById('settings_featuring_selector').value = settings.syntax.featuring;
            document.getElementById('settings_versus_selector').value = settings.syntax.versus;
            document.getElementById('settings_and_selector').value = settings.syntax.and;
            document.getElementById('settings_featured_fixer_switch').checked = settings.featured_fix.switch;
        });
    });
}
// set default settings and save them to the disk
function settings_reset() {
    settings.promo = 'Unknown Artist - Unknown Title';
    settings.ignore = {};
    settings.ignore.switch = false;
    settings.ignore.keywords = '';
    settings.syntax = {};
    settings.syntax.switch = false;
    settings.syntax.featuring = '';
    settings.syntax.versus = '';
    settings.syntax.and = '';
    settings.featured_fix = {};
    settings.featured_fix.switch = false;
    settings.omit = {}
    settings.omit.switch = false;
    settings.omit.keywords = '';
   ``
    // save settings to file
    storage.set('settings', settings, function(err) {
        if (err) throw error;   
    });
    // load settings after they have been set
    settings_load();
}
// save settings after they have been modified by the user
function settings_save() {
    // grab values from the settings form
    settings.promo = document.getElementById('settings_promo_input').value;
    settings.ignore.switch = document.getElementById('settings_ignore_switch').checked;
    settings.ignore.keywords = document.getElementById('settings_ignore_input').value;
    settings.syntax.switch = document.getElementById('settings_syntax_fixer_switch').checked;
    settings.syntax.featuring = document.getElementById('settings_featuring_selector').value;
    settings.syntax.versus = document.getElementById('settings_versus_selector').value;
    settings.syntax.and = document.getElementById('settings_and_selector').value;
    settings.featured_fix.switch = document.getElementById('settings_featured_fixer_switch').checked;
    settings.omit.switch = document.getElementById('settings_omit_switch').checked;
    settings.omit.keywords = document.getElementById('settings_omit_input').value;

    // save settings to disk
    storage.set('settings', settings, function(err) {
        if (err) throw error;
    });
    //close the settings modal
    close_modal('settings_modal');
    // parse the tracklist again with updated settings
    updateUI();
}
// this little function ensures that keywords entered by the user can contain special characters
// otherwise special characters might engage regex syntax
RegExp.escape = function(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
// Check for passed arguments (Open with tracklister.exe)
remote.process.argv.forEach(function(argument) {
    if (RegExp('.m3u8|.csv|.m3u|.nml').test(RegExp.escape(argument))) {
        setUI();
        console.log(argument);
        convertFile(argument);
    }
});
// listen for file drop
document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // clear / prepare the UI
    console.log(e);
    setUI();
    // get file object from drop
    for (const f of e.dataTransfer.files) {
        // start the conversion process
        convertFile(f.path);
    }
});
// handle key inputs
document.addEventListener('keyup', function(e) {
    if (e.key === "Escape") {
        Array.from(document.getElementsByClassName('modal')).forEach(function(elem) {
            close_modal(elem.id);
        });
    }
    if (e.key === "Enter") {
        Array.from(document.getElementsByClassName('modal')).forEach(function(elem) {
            if (elem.classList.contains('is-active')) {
                elem.getElementsByClassName('submit')[0].click();
            }
        });
    }
});

// clear and prepare the UI / copy button gets activated
function setUI() {
    document.getElementById("copy_btn").disabled = false;
    document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
    document.getElementById("tracklist").innerHTML = "";
    document.getElementById("pure_text").innerHTML = "";
    //tracks.length = 0;
}
// clear and prepare the UI / copy button gets deactivated
function resetUI() {
    document.getElementById("copy_btn").disabled = true;
    document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
    document.getElementById("tracklist").innerHTML = "";
    document.getElementById("pure_text").innerHTML = "";
    //tracks.length = 0;
}
// add event listener for the copy button
document.getElementById('copy_btn').addEventListener('click', function() {
    // copy text from pure text element to the clipboard
    clipboard.writeText(document.getElementById('pure_text').innerText);
    // change the copy button apperance => opaque icon ("has been copied!")
    this.innerHTML = '<i class="fas fa-copy"></i>';
});
document.getElementById('erase_btn').addEventListener('click', function() {
    tracks.length = 0;
    resetUI();
});
// generic function to close modal of id
function close_modal(id) {
    document.getElementById(id).classList.remove('is-active');
    // the modal resets the scroll position, when opened for some reason
    // still looking for a way to prevent that, it's quite distracting
    // for now we just reset it after the modal is closed
    window.scrollTo(0, scroll_pos);
}
// generic function to open modal of id
function open_modal(id) {
    document.getElementById(id).classList.add('is-active');
}
// add event listener for modal backgrounds => close the modal on click 
Array.from(document.getElementsByClassName('modal-background')).forEach(function(element) {
    element.addEventListener('click', function() {
        element.parentNode.classList.remove('is-active');
    });
});
// dragover function (no implementation yet)
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    //open_modal('drop_modal');
    //console.log(e);
});
// dragleave function (no implementation yet)
document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    //close_modal('drop_modal');
});

// determine file type and call file specific function
function convertFile(input_file) {
    // extract extension from file name
    var extension = input_file.split('.').pop();
    extension = extension.toLowerCase();
    // call conversion function based on extension
    switch (extension) {
        case 'm3u8':
            m3u8(input_file);
            break;
        case 'nml':
            nml(input_file);
            break;
        case 'csv':
            csv(input_file);
            break;
        case 'm3u':
            m3u(input_file);
            break;
        // audio files
        case 'wav':
        case 'mp3':
        case 'flac':
        case 'aiff':
        case 'aif':
        case 'aac':
        case 'ogg':
        case 'wma':  
            audio(input_file);
            break;
        default:
            alert('Unsupported file type! .m3u8, .nml, .csv and .m3u are supported.');
            resetUI();
            break;
    }
}
// make dropdowns work
function toggle_dropdown(element, id) {
    // make sure all dropdowns are closed before a new one is opened
    Array.from(document.getElementsByClassName('dropdown')).forEach(function(elem) {
        if (element.parentNode.parentNode != elem) {
            elem.classList.remove('is-active');    
        }
    });
    // make dropdown visible
    element.parentNode.parentNode.classList.toggle('is-active');
    // toggle the icons to make the dropdown more responsive
    // toggle down arrow
    element.getElementsByClassName('fas')[0].classList.toggle('fa-angle-down');
    // toggle up arrow
    element.getElementsByClassName('fas')[0].classList.toggle('fa-angle-up');
}

// after destructive actions have been performed on the tracklist, 
// the UI needs to reload to display those changes
function updateUI() {
    // save the current scroll location before clearing the screen
    scroll_pos = window.scrollY;
    window.scroll(0,0);
    // reset counter to make sure the numbering is correct
    var counter = 0;
    // make sure tracklist and pure_text are blank before written to
    document.getElementById("tracklist").innerHTML = "";
    document.getElementById("pure_text").innerHTML = "";
    // style copy button to convey that the latest changes have not been copied yet
    document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
    // iterate through tracks array and call writeTrack() to write them to screen and to pure_text
    tracks.forEach(function (track) {
        counter++;
        writeTrack(track, counter);
    });
    // apply the scroll location again
    // apparently chrome is too fast, it doesn't work without the millisecond delay
    setTimeout(function() {window.scrollTo(0, scroll_pos);},1)
}
// deletes a the desired track, reindexes the array and reloads the UI
function delete_track(element, id) {
    tracks.splice(id-1, 1);
    updateUI();
}
// sets track at id-1 to promo (be careful that counter is always +1, due to js counting from 0)
function set_promo(element, id) {
    tracks[id-1] = settings.promo;
    updateUI();
}
// populates the edit modal form with values and opens it
// sets is_editing to the id of the counter of the track that is being edited,
// this just makes saving the data easier
function edit_track(element, id) {
    document.getElementById('edit_input').value = tracks[id-1];
    is_editing = id;
    open_modal('edit_modal');
    document.getElementById('edit_input').focus();
}
// save the the edited / added data at the desired location, close the edit modal and reload the UI
// because we re-use the edit modal for adding, they also share the same save function
function edit_save() {
    // check whether we're editing or adding
    if (is_adding) {
        // the temporary array is necessary, otherwise the array can't be read/written properly
        var temp_tracks = [];
        var desired_location;
        // determine the array index where the track should be stored
        if (is_add_above) {desired_location = is_editing-1}
        if (is_add_below) {desired_location = is_editing}
        // if neither add above or add below is specified, it will simply be appended
        if(!is_add_above && !is_add_below) {desired_location = tracks.length}
        // iterate through the tracks array
        // shift all entries after the desired location down by one
        for (let i = 0; i < tracks.length; i++) {
            if (i >= desired_location) {
                temp_tracks[i+1] = tracks[i];
            }
            // keep all entries before the desired location
            else {temp_tracks[i] = tracks[i];}
        }
        // assign the added track to the "now free" index
        temp_tracks[desired_location] = document.getElementById('edit_input').value;
        // apply the temporary array
        tracks = temp_tracks;
    }
    // apply the edited value to the original value in the array
    else {
        tracks[is_editing-1] = document.getElementById('edit_input').value;
    }
    // close the modal and reset all the flags
    close_modal('edit_modal');
    is_adding = false;
    is_add_above = false;
    is_add_below = false;
    // refresh the UI
    updateUI();
}
// function for adding tracks (plus button)
// because we are reusing the edit modal, saving can be done via the edit_save function
// if no arguments are passed: simply append the new track to the end of the tracklist
function add_track(id) {
    is_adding = true;
    document.getElementById('edit_input').value = "";
    if (id == 'new') {
        is_editing = tracks.length+1;
    }
    else {
        is_editing = id;
        console.log('is_editing:' + id);
    }
    open_modal('edit_modal');
    document.getElementById('edit_input').focus();
}
function add_above(id) {
    is_add_above = true;
    add_track(id);
}
function add_below(id) {
    is_add_below = true;
    add_track(id);
}
// this filter returns true if the track passes the ignore list
// if it returns false, a match with one of the keywords has been found 
function filter_ignore(track, counter) {
    try {
        // If this setting is disabled, return true / let the track pass
        if (!settings.ignore.switch) {
            return true;
        }
        // check if the keywords string contains any seperators (',')
        if (RegExp(',').test(RegExp.escape(settings.ignore.keywords))) {
            // split the list of keywords by ',' and iterate through them
            settings.ignore.keywords.split(',').forEach(function (keyword) {
                // check if keyword is found in track name
                if ((new RegExp(RegExp.escape(keyword), 'gi')).test(track)) {
                    // if a match is found => remove track from array and return false
                    tracks.splice(counter-1, 1);
                    return false;
                }
            });
        }
        // do this if no seperators (',') have been found in the keywords string
        else {
            // if keywords string is empty, let the track pass
            if (settings.ignore.keywords == '') {
                return true;
            }
            // if the keywords string is not empty
            // assume the keywords string only contains one keyword
            // check against the keyword
            else {
                // if a match is, remove the track from the array and let the track fail
                if ((new RegExp(RegExp.escape(settings.ignore.keywords), 'gi')).test(track)) {
                    tracks.splice(counter-1, 1);
                    return false;
                }
                // if no matches are found, let the track pass
                else {
                    return true;
                }
            }
        }
    }
    catch {
        return true;
    }
}
// this filter finds 'featuring', 'versus' and 'AND' conventions in track names
// it will then change them to the user's set preference
function filter_syntax(track) {
    try {
        // if this setting is turned off => return the unmodified track
        if (!settings.syntax.switch) {
            return track;
        }
        // if the 'featuring' string is not empty =>
        // find and replace all instances with the set preference
        // try and catch are necessary in case it can't find any instances of these conventions
        // => save changes to the track variable
        if (settings.syntax.featuring != '') {
            try{
                track = track.replace(new RegExp('( featuring | ft | ft\. | feat | feat\. )', 'gi'), ' ' + settings.syntax.featuring + ' ');
            }
            catch {}
        }
        // same for the 'versus' string
        if (settings.syntax.versus != '') {
            try {
                track = track.replace(new RegExp('( versus | vs | vs\. )', 'gi'), ' ' + settings.syntax.versus + ' ');
            }
            catch {}
        }
        // same for the 'AND' string
        if (settings.syntax.and != '') {
            try {
                track = track.replace(new RegExp('( and | & | \\+ )', 'i'), ' ' + settings.syntax.and + ' ');
            }
            catch {}
        }
        // when done, return the modified track
        return track;
    }
    catch {
        return track;
    }
}
// this filter will look for featuring tags in the title column
// and append them to the artist column
function filter_feature_fix(track) {
    // return unmodified track, if turned off
    try {
        if (!settings.featured_fix.switch) {
            return track;
        }
        // split track into artist and title column by looking for the ' - ' string
        var artist = track.split(' - ').shift();
        var title = track.split(' - ').pop();
        try {
            // attempt to match featuring tags in the title string
            // if found it will extract everything after the tag, including the tag itself
            // this info will be stored in the feature variable
            var feature = title.match(new RegExp('( featuring | ft | ft\. | feat | feat\. )(.*)', 'gi')).pop();
            // remove extracted string from the title column
            title = title.replace(feature, '');
            // append the feature string to the artist column
            artist += " " + feature;
        }
        catch {}
        // merge artist and title back together and return them
        return artist + ' - ' + title;
    }
    catch {
        return track
    }
}
// this filter looks for keywords in the track name 
// if a match is found, the phrase will be removed from the trackname
// difference to the ignore filter => track will not get deleted, if a match is found
// ==> track gets modified
function filter_omit(track) {
    try {
        // return unmodified track if setting is turned off
        if (!settings.omit.switch) {
            return track;
        }
        else {
            // return unmodified track if the keyword list is empty
            if (settings.omit.keywords == '') {
                return track;
            }
            else {
                try {
                    // split the keywords string at (',') and iterate through them
                    settings.omit.keywords.split(',').forEach(function(keyword) {
                        // if a match is found it will be replaced with an empty string
                        track = track.replace(RegExp(RegExp.escape(keyword), 'gi'), '');
                    });
                    // return the modified track 
                    return track;
                }
                // if no seperator has been found, assume there is only one keyword
                catch {
                    // if a match is found it will be replaced with an empty string
                    track = track.replace(RegExp(RegExp.escape(settings.omit.keywords), 'gi'), '');
                    return track;
                }
            }
        }
    }
    catch {
        return track;
    }
}
// this function runs the track through all the different filters
function filter(track, id) {
    // modify the track by calling the different filters
    track = filter_feature_fix(track);
    track = filter_syntax(track);
    track = filter_omit(track);
    // if the track passes, save it to the array and return it
    if (filter_ignore(track, id)) {
        tracks[id-1] = track;
        return track;
    }
    // if the track does not pass, return false
    else {
        return false;
    }
}
// if called, it shifts the track one position up in the array
// => refresh the UI afterwards
function move_up(element, id) {
    // make sure the element isn't the first
    if (id-1 < 1) {}
    else {
        tracks = arrayMove(tracks, id-1, id-2);
        updateUI();
    }
}
// if called, it shifts the track one position down in the array
// => refresh the UI afterwards
function move_down(element, id) {
    // make sure the element isn't the last
    if (id-1 > tracks.length-1) {}
    else {
        tracks = arrayMove(tracks, id-1, id);
        updateUI();
    }
}
// this is not a track filter but rather a filter for the counter itself
// hence it's strange placement
function filter_tracknumber(counter) {
    if (settings.tracknumber.switch) {
        var counter_digits;
        var highest_digits;
        var temp_counter = counter;
        var temp_tracklength = tracks.length;

        if (counter >= 1) ++counter_digits;

        while(temp_counter / 10 >= 1) {
            temp_counter /= 10;
            ++counter_digits;
        }

        if (tracks.length >= 1) ++highest_digits;

        while(temp_tracklength / 10 >= 1) {
            temp_tracklength /= 10;
            ++highest_digits;
        }
        console.log(highest_digits);
        console.log(counter_digits);
        for (let index = 0; counter_digits < highest_digits; index++) {
            counter = '0' + counter;
            console.log('yay');
        }
    }

    return counter
}
// this function is responsible for writing tracks to the screen
function writeTrack(track, counter) {
    // run the through all the filters
    track = filter(track, counter);
    // if it doesn't pass, return 0
    if (!track) {
        return 0;
    }
    // because the counter might get altered in some way,
    // we have to use a seperate variable for the one that gets displayed
    var display_counter = counter;
    // set track in the array  (this may be redundant, could possibly be removed)
    tracks[counter-1] = track;
    // write the visible tracklist in html
    // this includes the dropdown, containing the options for edit, delete etc.
    document.getElementById('tracklist').innerHTML += `
        <div class="dropdown">
            <div class="dropdown-trigger">
                <button onclick="toggle_dropdown(this, `+counter+`)" class="button is-small is-white dropdown-trigger-btn" aria-haspopup="true" id="dropdown-`+counter+`">
                    <span class="icon is-small">
                        <i class="fas fa-angle-down" aria-hidden="true"></i>
                    </span>
                </button>
            </div>
            <div class="dropdown-menu" id="dropdown-`+counter+`" role="menu">
                <div class="dropdown-content">
                    <a href="#" onclick="delete_track(this, `+counter+`)" class="dropdown-item has-text-danger">
                        <i class="fas fa-eraser"></i> Delete
                    </a>
                    <hr class="dropdown-divider">
                    <a href="#" onclick="set_promo(this, `+counter+`)" class="dropdown-item has-text-warning">
                        <i class="fas fa-asterisk"></i> Set to Promo
                    </a>
                    <a href="#" onclick="edit_track(this, `+counter+`)" class="dropdown-item">
                        <i class="fas fa-edit"></i> Edit
                    </a>
                    <hr class="dropdown-divider">
                    <a href="#" onclick="move_up(this, `+counter+`)" class="dropdown-item">
                        <i class="fas fa-angle-up"></i> Move Up 
                    </a>
                    <a href="#" onclick="move_down(this, `+counter+`)" class="dropdown-item">
                        <i class="fas fa-angle-down"></i> Move Down
                    </a>
                    <hr class="dropdown-divider">
                    <a href="#" onclick="add_above(` + (counter) + `)" class="dropdown-item">
                        <i class="fas fa-angle-double-up"></i> Insert 1 above
                    </a>
                    <a href="#" onclick="add_below(` + (counter) + `)" class="dropdown-item">
                        <i class="fas fa-angle-double-down"></i> Insert 1 below
                    </a>
                </div>
            </div>
        </div>
    ` + display_counter + '. ' + track + '<br/>';
    // also write the track to pure_text
    // pure_text is invisible and is only used to make copying the tracklist easier
    document.getElementById('pure_text').innerHTML += counter + '. ' + track + '\n';
}

// this function handles .m3u8 files
// these .m3u8 files must have been exported by Rekordbox 
// interpretations differ from program to program
function m3u8(input_file) {
    // declare counter and track
    var counter = 0;
    var track;
    // create a readline filestream, in order to read the file line by line
    const rl = readline.createInterface({
        input: fs.createReadStream(input_file),
        output: process.stdout,
        console: false
    });
    // iterate through every line
    rl.on('line', function(line) {
        // example of a line containing useful data:
        // #EXTINF:269,LU-I - Swallow tail
        // everything interesting is stored after a comma
        // if there is no comma, there is nothing interesting in that line
        if (RegExp("#EXTINF:").test(line)) {
            // if found
            // increase the counter
            counter += 1;
            // attempt to split the track at the first comma
            // extract everything after the comma
            try {
                var temp = line.split(',', 1).shift() + ',';
                track = line.replace(temp, '');
            }
            // display an error for the file that could not be gathered properly
            // assume that the file has been not been tagged properly
            catch {
                track = "###Error, is this file tagged properly?";
            }
            // append the extracted to the tracks array
            tracks.push(track);
            // write the track
            var ignored = writeTrack(track, counter);
            // if it does not pass, the counter has to be decreased to account for the missing track
            if (ignored == 0) {counter--}
        }
    })
}
// this function handles .csv files
// these .csv files must have been exported by Serato 
// interpretations differ from program to program
function csv(input_file) {
    // declare counter, line_counter and track
    var counter = 0;
    var line_counter = 0;
    var track;
    // create filestream in order to read the file line by line
    const rl = readline.createInterface({
        input: fs.createReadStream(input_file),
        output: process.stdout,
        console: false
    });
    // iterate through every line
    rl.on('line', function(line) {
        // the first three lines in Serato's .csv files are essentially useless
        // this makes sure they are skipped
        line_counter += 1; 
        if (line_counter > 2) {
            // increase the track counter
            counter += 1;
            // example of a line
            // "Audiofreq - Dance 2 Music (Extended Mix)","16:56:00","17:01:45","00:05:45","1",""
            // everything before the first '",' contains the trackname
            // extract that and replace the '"' at the beginning
            try {
                track = line.split('",', 1).shift().replace('"', '');
            }
            // if the track is not tagged properly this may cause issues 
            // set the track to an error string
            catch {
                track = "###Error, is this file tagged properly?";
            }
            // append the track to the tracks array
            tracks.push(track);
            // write the track
            var ignored = writeTrack(track, counter);
            // if it does not pass, the counter has to be decreased to account for the missing track
            if (ignored == 0) {counter--}
        }
    })
}
// this function handles .nml files
// these .nml files must have been exported by Traktor 
// interpretations differ from program to program
function nml(input_file) {
    // declare some variables
    var counter = 0;
    var track;
    var json;
    var content;
    // because .nml is essentially xml, we can read the entire file as one
    fs.readFile(input_file, 'utf8', function(err, contents) {
        // convert the xml to json 
        json = xml_js.xml2json(contents, {compact: true, spaces: 4});
        // parse the json into a javascript object
        content = JSON.parse(json);
        // iterate through all 'Entry' elements 
        content.NML.COLLECTION.ENTRY.forEach(element => {
            // increase counter
            counter += 1;
            // extract data from the artist and title column
            // save to the track variable
            try {
                track = element._attributes.ARTIST + " - " + element._attributes.TITLE
            }
            // if the track is not tagged properly, this may cause issues
            // set track to an error message
            catch {
                track = "###Error, is this file tagged properly?";
            }
            // write track
            var ignored = writeTrack(track, counter);
            // if it does not pass, the counter has to be decreased to account for the missing track
            if (ignored == 0) {counter--}
        });
    }); 
}
// this function handles .m3u files
// these .m3u files must have been exported by VirtualDJ (Traktor's .m3u will not work!)
// interpretations differ from program to program
function m3u(input_file) {
    // declare variables
    var counter = 0;
    var track;
    // create filestream to read the file line by line
    const rl = readline.createInterface({
        input: fs.createReadStream(input_file),
        output: process.stdout,
        console: false
    });
    // iterate through every line
    rl.on('line', function(line) {
        // lines containing interesting data in VDJ's .m3u files look like this:
        // #EXTVDJ:<time>18:51</time><lastplaytime>1562431872</lastplaytime><filesize>14509227</filesize><artist>SPIT</artist><title>Check This</title>
        // Because they all start with #EXTVDJ, we only check lines containing that phrase
        if (RegExp("#EXTVDJ").test(line)) {
            // increase counter
            counter += 1;
            // extract everything that is contained between <artist> and </artist> and <title> and </title>
            // merge them together into the track name
            try {
                track = line.match(new RegExp('<artist>(.*)</artist>')).pop() + 
                ' - ' + line.match('<title>(.*)</title>').pop(); 
            }
            // If the track is not tagged properly, those tags can't be found in the line
            // ==> set track to error message
            catch {
                track = "###Error, is this file tagged properly?";
            }
            // write track
            var ignored = writeTrack(track, counter);
            // if it does not pass, the counter has to be decreased to account for the missing track
            if (ignored == 0) {counter--}
        }
    });
}

// when an audio file is dropped -> get metadata / filename
function audio(input_file) {

    mm.parseFile(input_file, {native: false})
        .then(metadata => {
            var track = '';
            var artist = util.inspect(metadata.common.artist, {showHidden : false, depth : null});
            if (artist == '') { util.inspect(metadata.common.artists, {showHidden : false, depth : null}); }

            var title = util.inspect(metadata.common.title, {showHidden : false, depth : null});

            artist = artist.substr(1, artist.length -2);
            title = title.substr(1, title.length -2);

            if (artist && title && artist != 'ndefine' && title != 'ndefine') {
                track = artist + ' - ' + title;
            }   
            else {
                track = input_file.replace(/^.*[\\\/]/, '').split('.').slice(0, -1).join('.');
            }
            tracks.push(track);
            updateUI();
            console.log(tracks);
        })
        .catch ( err => {
            console.error(err.message);
        })
}

function monitor_rekordbox(rekordbox_path) {
    setInterval(function() {
        fs.readdir(rekordbox_path, function(err, files) {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            else { console.log ("Scanning: " + rekordbox_path); }

            files.forEach(function(file) {
                console.log(file);
                let result = firstline(path.join(rekordbox_path, file));

                result.then(
                    function(resolve) {

                        var array = resolve.split('');
                        var opening_braces = 0, closing_braces = 0, start_pos = 0, end_pos = 0;

                        for (let i = 0; i < array.length; i++) {
                            if (array[i] == '{') {
                                opening_braces++;

                                if (opening_braces == 1) {
                                    start_pos = i;
                                }
                            }
                            if (array[i] == '}') {
                                closing_braces++;
                                if (closing_braces == opening_braces) {
                                    end_pos = i;
                                    break;
                                }
                            }
                        }

                        if (start_pos == 0 && end_pos == 0) {
                            return;
                        }

                        console.log("Start Index: " + start_pos);
                        console.log("End Index: " + end_pos);

                        array.splice(0, start_pos);
                        array.splice(end_pos, array.length);
                        
                        //var clean = array.join('');
                        var clean = resolve.substring(start_pos, end_pos+1);

                        var object = JSON.parse(clean);
                        
                        console.log(object);
                    },
                    function(error) {
                        console.log("The promise could not be resolved.");
                    }
                )

                return;
                
            });
        });

        if (!is_monitoring) {return;}
    }, 1000);
}