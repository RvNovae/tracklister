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

