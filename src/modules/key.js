const DOM = require('./DOM');

// handle key inputs
document.addEventListener('keyup', function(e) {
    if (e.key === "Escape") {
        Array.from(document.getElementsByClassName('modal')).forEach(function(elem) {
            DOM.Modal.Close(elem.id);
        });
    }
    if (e.key === "Enter") {
        let counter = 0;
        Array.from(document.getElementsByClassName('modal')).forEach(function(elem) {
            if (elem.classList.contains('is-active')) {
                counter++;
                elem.getElementsByClassName('submit')[0].click();
            }
        });
        if (counter == 0) {
            Editor.Add.Append('new');
        }
    }
});