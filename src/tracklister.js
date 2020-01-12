const fs = require('fs');
const readline = require('readline');
const { app, shell } = require('electron');
const xml_js = require('xml-js');
const arrayMove = require('array-move');
const storage = require('electron-json-storage');
const remote = require('electron').remote;
const util = require('util');
const path = require('path');
const process = require('process');

// The Apps's "Classes" aka Modules
const BeatportLink = require('./modules/beatport-link');
const DOM = require('./modules/DOM');
const Settings = require('./modules/settings');
const Data = require('./modules/data');
const Helper = require('./modules/helper');
const Converter = require('./modules/converter');
const State = require('./modules/state');
require('./modules/key');

BeatportLink.Start();
Settings.Start();

// Check for passed arguments (Open with tracklister.exe)
remote.process.argv.forEach(function(argument) {
    if (RegExp('.m3u8|.csv|.m3u|.nml').test(Helper.RegExp.Escape(argument))) {
        DOM.UI.Set();
        Converter.Start(argument);
    }
});

// deletes a the desired track, reindexes the array and reloads the UI
function delete_track(element, id) {
    Data.Tracks.splice(id-1, 1);
    DOM.UI.Update();
}
// sets track at id-1 to promo (be careful that counter is always +1, due to js counting from 0)
function set_promo(element, id) {
    Data.Tracks[id-1] = Settings.Get().promo;
    DOM.UI.Update();
}
// populates the edit modal form with values and opens it
// sets is_editing to the id of the counter of the track that is being edited,
// this just makes saving the data easier
function edit_track(element, id) {
    document.getElementById('edit_input').value = Data.Tracks[id-1];
    State.Editing.Set(id);
    DOM.Modal.Open('edit_modal');
    document.getElementById('edit_input').focus();
}
// save the the edited / added data at the desired location, close the edit modal and reload the UI
// because we re-use the edit modal for adding, they also share the same save function
function edit_save() {
    if (document.getElementById('edit_input').value == "") {
        DOM.Modal.Close('edit_modal');
        State.Reset();
        return;
    }
    // check whether we're editing or adding
    if (State.Adding.Get()) {
        // the temporary array is necessary, otherwise the array can't be read/written properly
        var temp_tracks = [];
        var desired_location;
        // determine the array index where the track should be stored
        if (State.Adding.Above.Get()) {desired_location = State.Editing.Get()-1}
        if (State.Adding.Below.Get()) {desired_location = State.Editing.Get()}
        // if neither add above or add below is specified, it will simply be appended
        if(!State.Adding.Above.Get() && !State.Adding.Below.Get()) {desired_location = Data.Tracks.length}
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
        Data.Tracks[State.Editing.Get()-1] = document.getElementById('edit_input').value;
    }
    // close the modal and reset all the flags
    DOM.Modal.Close('edit_modal');
    State.Reset();
    // refresh the UI
    DOM.UI.Update();
}
// function for adding tracks (plus button)
// because we are reusing the edit modal, saving can be done via the edit_save function
// if no arguments are passed: simply append the new track to the end of the tracklist
function add_track(id) {
    State.Adding.Set(true);
    document.getElementById('edit_input').value = "";
    if (id == 'new') {
        State.Editing.Set(Data.Tracks.length+1);
    }
    else {
        State.Editing.Set(id);
    }
    DOM.Modal.Open('edit_modal');
    document.getElementById('edit_input').focus();
}
function add_above(id) {
    State.Adding.Above.Set(true);
    add_track(id);
}
function add_below(id) {
    State.Adding.Below.Set(true);
    add_track(id);
}
// this filter returns true if the track passes the ignore list
// if it returns false, a match with one of the keywords has been found 
function filter_ignore(track, counter) {
    try {
        // If this setting is disabled, return true / let the track pass
        if (!Settings.Get().ignore.switch) {
            return true;
        }
        // check if the keywords string contains any seperators (',')
        if (RegExp(',').test(Helper.RegExp.Escape(Settings.Get().ignore.keywords))) {
            // split the list of keywords by ',' and iterate through them
            Settings.Get().ignore.keywords.split(',').forEach(function (keyword) {
                // check if keyword is found in track name
                if ((new RegExp(Helper.RegExp.Escape(keyword), 'gi')).test(track)) {
                    // if a match is found => remove track from array and return false
                    Data.Tracks.splice(counter-1, 1);
                    return false;
                }
            });
        }
        // do this if no seperators (',') have been found in the keywords string
        else {
            // if keywords string is empty, let the track pass
            if (Settings.Get().ignore.keywords == '') {
                return true;
            }
            // if the keywords string is not empty
            // assume the keywords string only contains one keyword
            // check against the keyword
            else {
                // if a match is, remove the track from the array and let the track fail
                if ((new RegExp(Helper.RegExp.escape(Settings.Get().ignore.keywords), 'gi')).test(track)) {
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
        if (!Settings.Get().syntax.switch) {
            return track;
        }
        // if the 'featuring' string is not empty =>
        // find and replace all instances with the set preference
        // try and catch are necessary in case it can't find any instances of these conventions
        // => save changes to the track variable
        if (Settings.Get().syntax.featuring != '') {
            try{
                track = track.replace(new RegExp('( featuring | ft | ft\. | feat | feat\. )', 'gi'), ' ' + Settings.Get().syntax.featuring + ' ');
            }
            catch (error) {
                console.log(error);
            }
        }
        // same for the 'versus' string
        if (Settings.Get().syntax.versus != '') {
            try {
                track = track.replace(new RegExp('( versus | vs | vs\. )', 'gi'), ' ' + Settings.Get().syntax.versus + ' ');
            }
            catch {}
        }
        // same for the 'AND' string
        if (Settings.Get().syntax.and != '') {
            try {
                track = track.replace(new RegExp('( and | & | \\+ )', 'i'), ' ' + Settings.Get().syntax.and + ' ');
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
        if (!Settings.Get().featured_fix.switch) {
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
        if (!Settings.Get().omit.switch) {
            return track;
        }
        else {
            // return unmodified track if the keyword list is empty
            if (Settings.Get().omit.keywords == '') {
                return track;
            }
            else {
                try {
                    // split the keywords string at (',') and iterate through them
                    Settings.Get().omit.keywords.split(',').forEach(function(keyword) {
                        // if a match is found it will be replaced with an empty string
                        track = track.replace(RegExp(Helper.RegExp.Escape(keyword), 'gi'), '');
                    });
                    // return the modified track 
                    return track;
                }
                // if no seperator has been found, assume there is only one keyword
                catch {
                    // if a match is found it will be replaced with an empty string
                    track = track.replace(RegExp(Helper.RegExp.Escape(Settings.Get().omit.keywords), 'gi'), '');
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
    if (Settings.Get().tracknumber.switch) {
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
