const Data = require('./data');

Modal = {
    Close: function(id){
        document.getElementById(id).classList.remove('is-active');
        // the modal resets the scroll position, when opened for some reason
        // still looking for a way to prevent that, it's quite distracting
        // for now we just reset it after the modal is closed
        window.scrollTo(0, scroll_pos);
    },
    Open: function(id) {
        document.getElementById(id).classList.add('is-active');
    }
};

UI = {
    Set: function() {
        document.getElementById("copy_btn").disabled = false;
        document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
        document.getElementById("tracklist").innerHTML = "";
        document.getElementById("pure_text").innerHTML = "";
        Data.Tracks.length = 0;
    },
    Reset: function() {
        document.getElementById("copy_btn").disabled = true;
        document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
        document.getElementById("tracklist").innerHTML = "";
        document.getElementById("pure_text").innerHTML = "";
        Data.Tracks.length = 0;
    },
    Update: function() {
        // save the current scroll location before clearing the screen
        scroll_pos = window.scrollY;
        window.scroll(0,0);
        // reset counter to make sure the numbering is correct
        var counter = 0;
        // make sure tracklist and pure_text are blank before written to
        document.getElementById("tracklist").innerHTML = "";
        document.getElementById("pure_text").innerHTML = "";

        console.log(Data.Tracks);

        // style copy button to convey that the latest changes have not been copied yet
        document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
        // iterate through tracks array and call writeTrack() to write them to screen and to pure_text
        Data.Tracks.forEach(function (track) {
            counter++;
            Write.Track(track, counter);
        });
        // apply the scroll location again
        // apparently chrome is too fast, it doesn't work without the millisecond delay
        setTimeout(function() {window.scrollTo(0, scroll_pos);},1)    
    }
}

// this function is responsible for writing tracks to the screen
Write = {
    Track: function(track, counter) {
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
        Data.Tracks[counter-1] = track;
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
}

module.exports = {
    Modal: Modal,
    UI: UI,
    Write: Write
}

// add event listener for modal backgrounds => close the modal on click 
Array.from(document.getElementsByClassName('modal-background')).forEach(function(element) {
    element.addEventListener('click', function() {
        //element.parentNode.classList.remove('is-active');
        Modal.Close(element.parentNode.id);
    });
});

// NOT IMPLEMENTED YET

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