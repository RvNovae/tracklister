window.settings = {};

module.exports = {
    Start: function() {
        try {
            load();
        }
        catch (error) {
            console.log("Settings could not be loaded, resetting: ", error);
            reset();
        }
    },
    Reset: reset,
    Save: save
}

// load settings from settings file into the settings menu
function load() {
    // check if settings file exists / create it if it doesn't exist
    fs.access(storage.getDataPath('settings'), (err) => {
        if (err) {
            reset();
            return;
        }
        // load settings
        storage.get('settings', function(err, data) {
            if (err) throw error;
            window.settings = data;

            // populate settings form
            document.getElementById('settings_promo_input').value = window.settings.promo;
            document.getElementById('settings_ignore_switch').checked = window.settings.ignore.switch;
            document.getElementById('settings_ignore_input').value = window.settings.ignore.keywords;
            document.getElementById('settings_omit_switch').checked = window.settings.omit.switch;
            document.getElementById('settings_omit_input').value = window.settings.omit.keywords;
            document.getElementById('settings_syntax_fixer_switch').checked = window.settings.syntax.switch;
            document.getElementById('settings_featuring_selector').value = window.settings.syntax.featuring;
            document.getElementById('settings_versus_selector').value = window.settings.syntax.versus;
            document.getElementById('settings_and_selector').value = window.settings.syntax.and;
            document.getElementById('settings_featured_fixer_switch').checked = window.settings.featured_fix.switch;
        });
    });
}
// set default settings and save them to the disk
function reset() {
    window.settings.promo = 'Unknown Artist - Unknown Title';
    window.settings.ignore = {};
    window.settings.ignore.switch = false;
    window.settings.ignore.keywords = '';
    window.settings.syntax = {};
    window.settings.syntax.switch = false;
    window.settings.syntax.featuring = '';
    window.settings.syntax.versus = '';
    window.settings.syntax.and = '';
    window.settings.featured_fix = {};
    window.settings.featured_fix.switch = false;
    window.settings.omit = {}
    window.settings.omit.switch = false;
    window.settings.omit.keywords = '';
   
    // save settings to file
    storage.set('settings', window.settings, function(err) {
        if (err) throw error;   
    });
    // load settings after they have been set
    load();
}
// save settings after they have been modified by the user
function save() {
    // grab values from the settings form
    window.settings.promo = document.getElementById('settings_promo_input').value;
    window.settings.ignore.switch = document.getElementById('settings_ignore_switch').checked;
    window.settings.ignore.keywords = document.getElementById('settings_ignore_input').value;
    window.settings.syntax.switch = document.getElementById('settings_syntax_fixer_switch').checked;
    window.settings.syntax.featuring = document.getElementById('settings_featuring_selector').value;
    window.settings.syntax.versus = document.getElementById('settings_versus_selector').value;
    window.settings.syntax.and = document.getElementById('settings_and_selector').value;
    window.settings.featured_fix.switch = document.getElementById('settings_featured_fixer_switch').checked;
    window.settings.omit.switch = document.getElementById('settings_omit_switch').checked;
    window.settings.omit.keywords = document.getElementById('settings_omit_input').value;

    // save settings to disk
    storage.set('settings', window.settings, function(err) {
        if (err) throw error;
    });
    //close the settings modal
    DOM.Modal.Close('settings_modal');
    // parse the tracklist again with updated settings
    DOM.UI.Update();
}