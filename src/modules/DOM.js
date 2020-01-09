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
    }
}