const STORAGE = require('electron-json-storage');

module.export = {
    Start: function() {
        try {
            load();
        }
        catch {
            reset();
        }
    },
    Save: save(),
    Settings: Object,
}

// load settings from settings file into the settings menu
function load() {
    // check if settings file exists / create it if it doesn't exist
    fs.access(STORAGE.getDataPath('settings'), (err) => {
        if (err) {
            reset();
        }
        // load settings
        STORAGE.get('settings', function(err, data) {
            if (err) throw error;
            settings = data;
            // populate settings form
            document.getElementById('settings_promo_input').value = Settings.promo;
            document.getElementById('settings_ignore_switch').checked = Settings.ignore.switch;
            document.getElementById('settings_ignore_input').value = Settings.ignore.keywords;
            document.getElementById('settings_omit_switch').checked = Settings.omit.switch;
            document.getElementById('settings_omit_input').value = Settings.omit.keywords;
            document.getElementById('settings_syntax_fixer_switch').checked = Settings.syntax.switch;
            document.getElementById('settings_featuring_selector').value = Settings.syntax.featuring;
            document.getElementById('settings_versus_selector').value = Settings.syntax.versus;
            document.getElementById('settings_and_selector').value = Settings.syntax.and;
            document.getElementById('settings_featured_fixer_switch').checked = Settings.featured_fix.switch;
        });
    });
}
// set default settings and save them to the disk
function reset() {
    Settings.promo = 'Unknown Artist - Unknown Title';
    Settings.ignore = {};
    Settings.ignore.switch = false;
    Settings.ignore.keywords = '';
    Settings.syntax = {};
    Settings.syntax.switch = false;
    Settings.syntax.featuring = '';
    Settings.syntax.versus = '';
    Settings.syntax.and = '';
    Settings.featured_fix = {};
    Settings.featured_fix.switch = false;
    Settings.omit = {}
    Settings.omit.switch = false;
    Settings.omit.keywords = '';
   
    // save settings to file
    STORAGE.set('settings', settings, function(err) {
        if (err) throw error;   
    });
    // load settings after they have been set
    load();
}
// save settings after they have been modified by the user
function save() {
    // grab values from the settings form
    Settings.promo = document.getElementById('settings_promo_input').value;
    Settings.ignore.switch = document.getElementById('settings_ignore_switch').checked;
    Settings.ignore.keywords = document.getElementById('settings_ignore_input').value;
    Settings.syntax.switch = document.getElementById('settings_syntax_fixer_switch').checked;
    Settings.syntax.featuring = document.getElementById('settings_featuring_selector').value;
    Settings.syntax.versus = document.getElementById('settings_versus_selector').value;
    Settings.syntax.and = document.getElementById('settings_and_selector').value;
    Settings.featured_fix.switch = document.getElementById('settings_featured_fixer_switch').checked;
    Settings.omit.switch = document.getElementById('settings_omit_switch').checked;
    Settings.omit.keywords = document.getElementById('settings_omit_input').value;

    // save settings to disk
    STORAGE.set('settings', settings, function(err) {
        if (err) throw error;
    });
    //close the settings modal
    close_modal('settings_modal');
    // parse the tracklist again with updated settings
    updateUI();
}