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

// The Apps's "Classes" aka Modules
const BeatportLink = require('./modules/beatport-link');
const DOM = require('./modules/DOM');
const Settings = require('./modules/settings');
const Data = require('./modules/data');

BeatportLink.Start();
Settings.Start();

// saves the id/counter of the track that is currently being edited
var is_editing, is_adding, is_add_above, is_add_below;
var scroll_pos;


// this little function ensures that keywords entered by the user can contain special characters
// otherwise special characters might engage regex syntax
RegExp.escape = function(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
// Check for passed arguments (Open with tracklister.exe)
remote.process.argv.forEach(function(argument) {
    if (RegExp('.m3u8|.csv|.m3u|.nml').test(RegExp.escape(argument))) {
        DOM.UI.Set();
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
    DOM.UI.Set();
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
            DOM.Modal.Close(elem.id);
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

// add event listener for the copy button
document.getElementById('copy_btn').addEventListener('click', function() {
    // copy text from pure text element to the clipboard
    clipboard.writeText(document.getElementById('pure_text').innerText);
    // change the copy button apperance => opaque icon ("has been copied!")
    this.innerHTML = '<i class="fas fa-copy"></i>';
});
document.getElementById('erase_btn').addEventListener('click', function() {
    Data.Tracks.length = 0;
    DOM.UI.Reset();
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
            DOM.UI.Reset();
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


// deletes a the desired track, reindexes the array and reloads the UI
function delete_track(element, id) {
    Data.Tracks.splice(id-1, 1);
    DOM.UI.Update();
}
// sets track at id-1 to promo (be careful that counter is always +1, due to js counting from 0)
function set_promo(element, id) {
    Data.Tracks[id-1] = Settings.settings.promo;
    DOM.UI.Update();
}
// populates the edit modal form with values and opens it
// sets is_editing to the id of the counter of the track that is being edited,
// this just makes saving the data easier
function edit_track(element, id) {
    document.getElementById('edit_input').value = Data.Tracks[id-1];
    is_editing = id;
    DOM.Modal.Open('edit_modal');
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
        if(!is_add_above && !is_add_below) {desired_location = Data.Tracks.length}
        // iterate through the tracks array
        // shift all entries after the desired location down by one
        for (let i = 0; i < Data.Tracks.length; i++) {
            if (i >= desired_location) {
                temp_tracks[i+1] = Data.Tracks[i];
            }
            // keep all entries before the desired location
            else {temp_tracks[i] = Data.Tracks[i];}
        }
        // assign the added track to the "now free" index
        temp_tracks[desired_location] = document.getElementById('edit_input').value;
        // apply the temporary array
        Data.Tracks = temp_tracks;
    }
    // apply the edited value to the original value in the array
    else {
        Data.Tracks[is_editing-1] = document.getElementById('edit_input').value;
    }
    // close the modal and reset all the flags
    DOM.Modal.Close('edit_modal');
    is_adding = false;
    is_add_above = false;
    is_add_below = false;
    // refresh the UI
    DOM.UI.Update();
}
// function for adding tracks (plus button)
// because we are reusing the edit modal, saving can be done via the edit_save function
// if no arguments are passed: simply append the new track to the end of the tracklist
function add_track(id) {
    is_adding = true;
    document.getElementById('edit_input').value = "";
    if (id == 'new') {
        is_editing = Data.Tracks.length+1;
    }
    else {
        is_editing = id;
        console.log('is_editing:' + id);
    }
    DOM.Modal.Open('edit_modal');
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
        if (!Settings.settings.ignore.switch) {
            return true;
        }
        // check if the keywords string contains any seperators (',')
        if (RegExp(',').test(RegExp.escape(Settings.settings.ignore.keywords))) {
            // split the list of keywords by ',' and iterate through them
            Settings.settings.ignore.keywords.split(',').forEach(function (keyword) {
                // check if keyword is found in track name
                if ((new RegExp(RegExp.escape(keyword), 'gi')).test(track)) {
                    // if a match is found => remove track from array and return false
                    Data.Tracks.splice(counter-1, 1);
                    return false;
                }
            });
        }
        // do this if no seperators (',') have been found in the keywords string
        else {
            // if keywords string is empty, let the track pass
            if (Settings.settings.ignore.keywords == '') {
                return true;
            }
            // if the keywords string is not empty
            // assume the keywords string only contains one keyword
            // check against the keyword
            else {
                // if a match is, remove the track from the array and let the track fail
                if ((new RegExp(RegExp.escape(Settings.settings.ignore.keywords), 'gi')).test(track)) {
                    Data.Tracks.splice(counter-1, 1);
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
        if (!Settings.settings.syntax.switch) {
            return track;
        }
        // if the 'featuring' string is not empty =>
        // find and replace all instances with the set preference
        // try and catch are necessary in case it can't find any instances of these conventions
        // => save changes to the track variable
        if (Settings.settings.syntax.featuring != '') {
            try{
                track = track.replace(new RegExp('( featuring | ft | ft\. | feat | feat\. )', 'gi'), ' ' + Settings.settings.syntax.featuring + ' ');
            }
            catch {}
        }
        // same for the 'versus' string
        if (Settings.settings.syntax.versus != '') {
            try {
                track = track.replace(new RegExp('( versus | vs | vs\. )', 'gi'), ' ' + Settings.settings.syntax.versus + ' ');
            }
            catch {}
        }
        // same for the 'AND' string
        if (Settings.settings.syntax.and != '') {
            try {
                track = track.replace(new RegExp('( and | & | \\+ )', 'i'), ' ' + Settings.settings.syntax.and + ' ');
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
        if (!Settings.settings.featured_fix.switch) {
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
        if (!Settings.settings.omit.switch) {
            return track;
        }
        else {
            // return unmodified track if the keyword list is empty
            if (Settings.settings.omit.keywords == '') {
                return track;
            }
            else {
                try {
                    // split the keywords string at (',') and iterate through them
                    Settings.settings.omit.keywords.split(',').forEach(function(keyword) {
                        // if a match is found it will be replaced with an empty string
                        track = track.replace(RegExp(RegExp.escape(keyword), 'gi'), '');
                    });
                    // return the modified track 
                    return track;
                }
                // if no seperator has been found, assume there is only one keyword
                catch {
                    // if a match is found it will be replaced with an empty string
                    track = track.replace(RegExp(RegExp.escape(Settings.settings.omit.keywords), 'gi'), '');
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
        Data.Tracks[id-1] = track;
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
        Data.Tracks = arrayMove(Data.Tracks, id-1, id-2);
        DOM.UI.Update();
    }
}
// if called, it shifts the track one position down in the array
// => refresh the UI afterwards
function move_down(element, id) {
    // make sure the element isn't the last
    if (id-1 > Data.Tracks.length-1) {}
    else {
        Data.Tracks = arrayMove(Data.Tracks, id-1, id);
        DOM.UI.Update();
    }
}
// this is not a track filter but rather a filter for the counter itself
// hence it's strange placement
function filter_tracknumber(counter) {
    if (Settings.settings.tracknumber.switch) {
        var counter_digits;
        var highest_digits;
        var temp_counter = counter;
        var temp_tracklength = Data.Tracks.length;

        if (counter >= 1) ++counter_digits;

        while(temp_counter / 10 >= 1) {
            temp_counter /= 10;
            ++counter_digits;
        }

        if (Data.Tracks.length >= 1) ++highest_digits;

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
            Data.Tracks.push(track);
            // write the track
            var ignored = DOM.Write.Track(track, counter);
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
            Data.Tracks.push(track);
            // write the track
            var ignored = DOM.Write.Track(track, counter);
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
            var ignored = DOM.Write.Track(track, counter);
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
            var ignored = DOM.Write.Track(track, counter);
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
            Data.Tracks.push(track);
            DOM.UI.Update();
            console.log(Data.Tracks);
        })
        .catch ( err => {
            console.error(err.message);
        })
}
