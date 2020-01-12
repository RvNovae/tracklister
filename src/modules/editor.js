const ARRAY_MOVE = require('array-move');

module.exports = {
    Add: {
        Above: function(id) {
            addAbove(id);
        },
        Below: function(id) {
            addBelow(id);
        },
        Append: function(id) {
            addTrack(id);
        }
    },
    Move: {
        Up: function(element, id) {
            moveUp(element, id)
        },
        Down: function(element, id) {
            moveDown(element, id);
        }
    },
    Delete: function(element, id) {
        Data.Tracks.splice(id-1, 1);
        DOM.UI.Update();
    },
    Edit: {
        Start: function(element, id) {
            editTrack(element, id);
        },
        Save: function() {
            editSave();
        },
        Promo: function(element, id) {
            Data.Tracks[id-1] = Settings.Get().promo;
            DOM.UI.Update();
        }
    }
}

// function for adding tracks (plus button)
// because we are reusing the edit modal, saving can be done via the edit_save function
// if no arguments are passed: simply append the new track to the end of the tracklist
function addTrack(id) {
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

function addAbove(id) {
    State.Adding.Above.Set(true);
    addTrack(id);
}

function addBelow(id) {
    State.Adding.Below.Set(true);
    addTrack(id);
}

// if called, it shifts the track one position up in the array
// => refresh the UI afterwards
function moveUp(element, id) {
    // make sure the element isn't the first
    if (id-1 < 1) {}
    else {
        Data.Tracks = ARRAY_MOVE(Data.Tracks, id-1, id-2);
        DOM.UI.Update();
    }
}
// if called, it shifts the track one position down in the array
// => refresh the UI afterwards
function moveDown(element, id) {
    // make sure the element isn't the last
    if (id-1 > Data.Tracks.length-1) {}
    else {
        Data.Tracks = ARRAY_MOVE(Data.Tracks, id-1, id);
        DOM.UI.Update();
    }
}

// populates the edit modal form with values and opens it
// sets is_editing to the id of the counter of the track that is being edited,
// this just makes saving the data easier
function editTrack(element, id) {
    document.getElementById('edit_input').value = Data.Tracks[id-1];
    State.Editing.Set(id);
    DOM.Modal.Open('edit_modal');
    document.getElementById('edit_input').focus();
}

// save the the edited / added data at the desired location, close the edit modal and reload the UI
// because we re-use the edit modal for adding, they also share the same save function
function editSave() {
    if (document.getElementById('edit_input').value == "") {
        DOM.Modal.Close('edit_modal');
        State.Reset();
        return;
    }
    // check whether we're editing or adding
    if (State.Adding.Get()) {
        // the temporary array is necessary, otherwise the array can't be read/written properly
        var tempTracks = [];
        var desiredLocation;
        // determine the array index where the track should be stored
        if (State.Adding.Above.Get()) {desiredLocation = State.Editing.Get()-1}
        if (State.Adding.Below.Get()) {desiredLocation = State.Editing.Get()}
        // if neither add above or add below is specified, it will simply be appended
        if(!State.Adding.Above.Get() && !State.Adding.Below.Get()) {desiredLocation = Data.Tracks.length}
        // iterate through the tracks array
        // shift all entries after the desired location down by one
        for (let i = 0; i < Data.Tracks.length; i++) {
            if (i >= desiredLocation) {
                tempTracks[i+1] = Data.Tracks[i];
            }
            // keep all entries before the desired location
            else {tempTracks[i] = Data.Tracks[i];}
        }
        // assign the added track to the "now free" index
        tempTracks[desiredLocation] = document.getElementById('edit_input').value;
        // apply the temporary array
        Data.Tracks = tempTracks;
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