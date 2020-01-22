const FS = require('fs');
const STORAGE = require('electron-json-storage');

settings = {};

module.exports = {
    Settings: settings,
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
    Save: save,
    Get: function() {
        return settings;
    }
}

// load settings from settings file into the settings menu
function load() {
    // check if settings file exists / create it if it doesn't exist
    FS.access(STORAGE.getDataPath('settings'), (err) => {
        if (err) {
            console.log(err);
            reset();
            return;
        }

        // load settings
        STORAGE.get('settings', function(err, data) {
            if (err) {
                reset();
            };
            settings = data;
            // populate settings form
            try {
                document.getElementById('settings_promo_input').value = settings.promo;
                document.getElementById('settings_ignore_switch').checked = settings.ignore.switch;
                document.getElementById('settings_ignore_input').value = settings.ignore.keywords;
                document.getElementById('settings_omit_switch').checked = settings.omit.switch;
                document.getElementById('settings_omit_input').value = settings.omit.keywords;
                document.getElementById('settings_syntax_fixer_switch').checked = settings.syntax.switch;
                document.getElementById('settings_featuring_selector').value = settings.syntax.featuring;
                document.getElementById('settings_versus_selector').value = settings.syntax.versus;
                document.getElementById('settings_and_selector').value = settings.syntax.and;
                document.getElementById('settings_featured_fixer_switch').checked = settings.featured_fix.switch;
                document.getElementById('settings_bpl_switch').checked = settings.bpl.switch;
            }
            catch(err) {
                reset();
            }
            
        });
    });
}
// set default settings and save them to the disk
function reset() {
    settings.promo = 'Unknown Artist - Unknown Title';
    settings.ignore = {};
    settings.ignore.switch = false;
    settings.ignore.keywords = '';
    settings.syntax = {};
    settings.syntax.switch = false;
    settings.syntax.featuring = '';
    settings.syntax.versus = '';
    settings.syntax.and = '';
    settings.featured_fix = {};
    settings.featured_fix.switch = false;
    settings.omit = {}
    settings.omit.switch = false;
    settings.omit.keywords = '';
    settings.bpl = {};
    settings.bpl.switch = false;
    settings.bpl.path = "";

    console.log("Reset");
   
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
    settings.promo = document.getElementById('settings_promo_input').value;
    settings.ignore.switch = document.getElementById('settings_ignore_switch').checked;
    settings.ignore.keywords = document.getElementById('settings_ignore_input').value;
    settings.syntax.switch = document.getElementById('settings_syntax_fixer_switch').checked;
    settings.syntax.featuring = document.getElementById('settings_featuring_selector').value;
    settings.syntax.versus = document.getElementById('settings_versus_selector').value;
    settings.syntax.and = document.getElementById('settings_and_selector').value;
    settings.featured_fix.switch = document.getElementById('settings_featured_fixer_switch').checked;
    settings.omit.switch = document.getElementById('settings_omit_switch').checked;
    settings.omit.keywords = document.getElementById('settings_omit_input').value;
    settings.bpl.switch = document.getElementById('settings_bpl_switch').checked;

    // save settings to disk
    STORAGE.set('settings', settings, function(err) {
        if (err) throw error;
    });
    //close the settings modal
    DOM.Modal.Close('settings_modal');
    // parse the tracklist again with updated settings
    DOM.UI.Update();
}