const DOM = require('./DOM');

// handle key inputs
document.addEventListener('keyup', function(e) {
    if (e.key === "Escape") {
        Array.from(document.getElementsByClassName('modal')).forEach(function(elem) {
            DOM.Modal.Close(elem.id);
        });
    }
    if (e.key === "Enter") {
        let modals = 0;
        let contextMenus = 0;

        Array.from(document.getElementsByClassName('modal')).forEach(function(elem) {
            if (elem.classList.contains('is-active')) {
                modals++;
                elem.getElementsByClassName('submit')[0].click();
                return;
            }
        });

        Array.from(document.getElementsByClassName('dropdown')).forEach( (element) => {
            if (element.classList.contains('is-active')) {
                contextMenus++;
                element.getElementsByClassName('submit')[0].click();
                return;
            } 
        });

        if (modals == 0 && contextMenus == 0) {
            Editor.Add.Append('new');
            return;
        }
    }
});