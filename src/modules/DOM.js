module.exports = {
    Modal: {
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
    },
    UI: {
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
        }
    }
}