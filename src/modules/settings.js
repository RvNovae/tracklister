var settings = {};

module.exports = {
    Start: function() {
        try {
            load();
        }
        catch {
            reset();
        }
    },
    Reset: reset,
    Save: save,
    Settings: function() {
        return settings;
    },
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
            settings = data;
            // populate settings form
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
   
    // save settings to file
    storage.set('settings', settings, function(err) {
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

    // save settings to disk
    storage.set('settings', settings, function(err) {
        if (err) throw error;
    });
    //close the settings modal
    DOM.Modal.Close('settings_modal');
    // parse the tracklist again with updated settings
    DOM.UI.Update();
}