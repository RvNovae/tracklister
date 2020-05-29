const { clipboard } = require('electron');

const Data = require('./data');
const Converter = require('./converter');
const Filter = require('./filter');
const BeatportLink = require('./beatport-link');

window.scrollPos = 0;
document.getElementById('bpl_footer').style.visibility = "hidden";

Modal = {
    Close: function(id){
        document.getElementById(id).classList.remove('is-active');
        // the modal resets the scroll position, when opened for some reason
        // still looking for a way to prevent that, it's quite distracting
        // for now we just reset it after the modal is closed
        window.scrollTo(0, window.scrollPos);
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
        window.scrollPos = window.scrollY;
        window.scroll(0,0);
        // reset counter to make sure the numbering is correct
        var counter = 0;
        // make sure tracklist and pure_text are blank before written to
        document.getElementById("tracklist").innerHTML = "";
        document.getElementById("pure_text").innerHTML = "";

        // style copy button to convey that the latest changes have not been copied yet
        document.getElementById("copy_btn").disabled = false;
        document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
        // iterate through tracks array and call writeTrack() to write them to screen and to pure_text
        Data.Tracks.forEach(function (track) {
            counter++;
            Write.Track(track, counter);
        });
        // apply the scroll location again
        // apparently chrome is too fast, it doesn't work without the millisecond delay
        setTimeout(function() {window.scrollTo(0, window.scrollPos);},1)    
    }
}

// this function is responsible for writing tracks to the screen
Write = {
    Track: function(track, counter) {
        // run the through all the filters
        track = Filter.Process(track, counter);
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
                    <button onclick="Dropdown.Toggle(this, `+counter+`)" class="button is-small is-white dropdown-trigger-btn" aria-haspopup="true" id="dropdown-`+counter+`">
                        <span class="icon is-small">
                            <i class="fas fa-angle-down" aria-hidden="true"></i>
                        </span>
                    </button>
                </div>
                <div class="dropdown-menu" id="dropdown-`+counter+`" role="menu">
                    <div class="dropdown-content">
                        <a href="#" onclick="Editor.Edit.Start(this, `+counter+`)" class="dropdown-item">
                            <i class="fas fa-edit"></i> Edit
                        </a>

                        <a href="#" style="color:#0277BD" onclick="Editor.Edit.Promo(this, `+counter+`)" class="dropdown-item">
                            <i class="fas fa-asterisk"></i> Set to Promo
                        </a>

                        <hr class="dropdown-divider">

                        <a href="#" onclick="Editor.Delete(this, `+counter+`)" class="dropdown-item has-text-danger">
                            <i class="fas fa-eraser"></i> Delete
                        </a>     

                        <hr class="dropdown-divider">

                        <div class="field has-addons">
                            <p class="control">
                                <a class="button" onclick="Editor.Move.Down('move-`+ counter +`')">
                                    <span class="icon is-small">          
                                        <i class="fas fa-angle-up"></i>
                                    </span>
                                </a>
                            </p>
                            <p class="control">
                                <a class="button" onclick="Editor.Move.Up('move-`+ counter +`')">
                                    <span class="icon is-small">
                                        <i class="fas fa-angle-down"></i>
                                    </span>
                                </a>
                            </p>
                            <p class="control">
                                <input class="input" oninput="Editor.Move.Check(this)" data-pos="` + counter + `" id="move-`+ counter +`" value=`+counter+` placeholder="Pos">
                            </p> 
                            <p class="control">
                                <a class="button submit" onclick="Editor.Move.To('move-`+ counter +`')">
                                    <span class="icon is-small">
                                        <i class="fas fa-check"></i>
                                    </span>
                                </a>
                            </p>
                        </div>

                        <hr class="dropdown-divider">
                        <a href="#" onclick="Editor.Add.Above(` + (counter) + `)" class="dropdown-item">
                            <i class="fas fa-angle-double-up"></i> Insert 1 above
                        </a>
                        <a href="#" onclick="Editor.Add.Below(` + (counter) + `)" class="dropdown-item">
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

Dropdown = {
    Toggle: function(element, id) {
        // make dropdowns work
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
}

module.exports = {
    Modal: Modal,
    UI: UI,
    Dropdown: Dropdown,
    Write: Write
}

// add event listener for modal backgrounds => close the modal on click 
Array.from(document.getElementsByClassName('modal-background')).forEach(function(element) {
    element.addEventListener('click', function() {
        //element.parentNode.classList.remove('is-active');
        if (element.parentNode.id != 'yesno_modal') {
            Modal.Close(element.parentNode.id);
        }
    });
});

function YesNo() {
    return new Promise((resolve, reject) => {
        Modal.Open('yesno_modal');
        Array.from(document.getElementsByClassName('yesno_button')).forEach( (element) => {
            element.addEventListener('click', (e) => {
                resolve(e.srcElement.dataset.value);
            });
        });
    });
}

// listen for file drop
document.addEventListener('drop', (e) => {
    files = e.dataTransfer.files;
    e.preventDefault();
    e.stopPropagation();
    // clear / prepare the UI if playlist file
    if (RegExp('.m3u8|.csv|.m3u|.nml').test(Helper.RegExp.Escape(e.dataTransfer.files[0].path))) {
        if (Data.Tracks.length < 1) {
            DOM.UI.Set();
            for (const f of e.dataTransfer.files) {
                // start the conversion process
                Converter.Start(f.path);
            }
            return;
        }

        YesNo().then( (val) => {
            if (val == 'yes') 
                DOM.UI.Set();
            if (val == 'cancel') 
                return;

            for (const f of files) {
                Converter.Start(f.path);
            }
        });

        return;
    }
    else {
        for (const f of e.dataTransfer.files) {
            // start the conversion process
            Converter.Start(f.path);
        }
        return;
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
    if (Data.Tracks.length < 1) {return;}
    YesNo().then((val) => {
        if (val == 'yes') {
            Data.Tracks.length = 0;
            DOM.UI.Reset();
        }
    });
    
});

document.getElementById('add_bl_btn').addEventListener('click', (e) => {
    BeatportLink.Add();
    document.getElementById('bpl_footer').style.visibility = "hidden";
});

document.getElementById('settings_bpl_switch').addEventListener('change', (e) => {
    if (e.srcElement.checked) {
        BeatportLink.Start();
    }
    else {
        BeatportLink.Stop();
    }
    
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