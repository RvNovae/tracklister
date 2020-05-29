const REMOTE = require('electron').remote;

// The Apps's "Classes" aka Modules
const DOM = require('./modules/DOM');
const Settings = require('./modules/settings');
const Data = require('./modules/data'); // globally accessed in almost every module, therefore it gets required here
const Helper = require('./modules/helper');
const Converter = require('./modules/converter');
const Editor = require('./modules/editor'); // NOT UNUSED, the HTML needs the constant in order to access necessary functions

require('./modules/key'); // key functions never have to be called explicitly, therefore it doesn't need a constant 

// some of tracklister's functions need to be invoked at program start.

if (REMOTE.process.platform == 'win32') { // Currently beatport-link functionality only works on Windows
    try {
        const BeatportLink = require('./modules/beatport-link');
        BeatportLink.Start();
    }
    catch (err) {
        console.log("BeatportLink integration could not be initialised: " + err);
    }
}

// Check for passed arguments (Open with tracklister.exe)
REMOTE.process.argv.forEach(function(argument) {
    if (RegExp('.m3u8|.csv|.m3u|.nml').test(Helper.RegExp.Escape(argument))) {
        DOM.UI.Set();
        Converter.Start(argument);
    }
});