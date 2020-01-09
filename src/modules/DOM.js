const CLIPBOARD = require('electron');

module.export = {
    Write: Object = {
        BeatportLink: function(output) {
            document.getElementById('bl_current').innerHTML = output;
        }
    },
    UI: Object = {
        Set: function() {
            document.getElementById("copy_btn").disabled = false;
            document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
            document.getElementById("tracklist").innerHTML = "";
            document.getElementById("pure_text").innerHTML = "";
        },
        Reset: function() {
            document.getElementById("copy_btn").disabled = true;
            document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
            document.getElementById("tracklist").innerHTML = "";
            document.getElementById("pure_text").innerHTML = "";
        },
        Update: function() {
            // after destructive actions have been performed on the tracklist, 
            // the UI needs to reload to display those changes
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
    }
}

// EVENT LISTENERS

// listen for file drop
document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // clear / prepare the UI
    //console.log(e);
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

document.getElementById('copy_btn').addEventListener('click', function() {
    // copy text from pure text element to the clipboard
    CLIPBOARD.writeText(document.getElementById('pure_text').innerText);
    // change the copy button apperance => opaque icon ("has been copied!")
    this.innerHTML = '<i class="fas fa-copy"></i>';
});

document.getElementById('erase_btn').addEventListener('click', function() {
    tracks.length = 0;
    DOM.UI.Reset();
});

modal = {
    open: function(id) {
        document.getElementById(id).classList.add('is-active');
    },
    close: function(id) {
        document.getElementById(id).classList.remove('is-active');
        // the modal resets the scroll position, when opened for some reason
        // still looking for a way to prevent that, it's quite distracting
        // for now we just reset it after the modal is closed
        window.scrollTo(0, scroll_pos);    
    }
}