const fs = require('fs');
const readline = require('readline');
const { app, shell } = require('electron');
const xml_js = require('xml-js');
const arrayMove = require('array-move');
const storage = require('electron-json-storage');
const remote = require('electron').remote;
const util = require('util');
const path = require('path');
const process = require('process');

// The Apps's "Classes" aka Modules
const BeatportLink = require('./modules/beatport-link');
const DOM = require('./modules/DOM');
const Settings = require('./modules/settings');
const Data = require('./modules/data');
const Helper = require('./modules/helper');
const Converter = require('./modules/converter');
const State = require('./modules/state');
const Editor = require('./modules/editor');
require('./modules/key');

BeatportLink.Start();
Settings.Start();

// Check for passed arguments (Open with tracklister.exe)
remote.process.argv.forEach(function(argument) {
    if (RegExp('.m3u8|.csv|.m3u|.nml').test(Helper.RegExp.Escape(argument))) {
        DOM.UI.Set();
        Converter.Start(argument);
    }
});



