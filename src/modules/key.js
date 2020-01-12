const DOM = require('./DOM');

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