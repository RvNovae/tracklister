const PATH = require('path');
const FIRSTLINE = require('firstline');
const FS = require('fs');
const PROCESS = require('process');

var lastID = 0;
var rekordboxPath = getRekordboxPath();
var isMonitoring = false;

module.exports = {
    IsMonitoring: isMonitoring,
    Start: function() {
        isMonitoring = true;
        setInterval(function() {
            if (isMonitoring) {
                
                monitor(rekordboxPath);
            }
        }, 1000);
    },
    Stop: function() {
        isMonitoring = false;
    }
}

function monitor(path) {
    FS.readdir(path, function(err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        else { /*console.log ("Scanning: " + rekordboxPath);*/ }

        files.forEach(function(file) {
            let result = FIRSTLINE(PATH.join(path, file));

            result.then(
                function(resolve) {

                    if (typeof extractJSON(resolve) == 'undefined') {
                        return;
                    }

                    var object = JSON.parse(extractJSON(resolve));

                    if (object.id == lastID) {
                        return;
                    }
                    else {
                        lastID = object.id;
                        console.log(object);
                        
                        artist = formatArtist(object);
                        title = formatTitle(object);

                        console.log(artist + " - " + title);
                        document.getElementById('bl_current').innerHTML = artist + " - " + title;
                    }
                    
                },
                function(error) {
                    console.log("The promise could not be resolved: " + error);
                }
            )
            return;
        });
    });
}

function formatTitle(object) {
    if (object.remixers.length > 0) {
        return object.name + ' (' + object.mix_name + ')';
    }
    else {
        return object.name;
    }
}

function formatArtist(object) {
    let artist = "";
    for (let i = 0; i < object.artists.length; i++) {
    
        if (i == object.artists.length - 1) {
            artist += object.artists[i].name;
            break;
        }
        if (i == object.artists.length - 2) {
            artist += object.artists[i].name + " & ";
        }
        else {
            artist += object.artists[i].name + ", ";
        }
    }
    return artist;
}

function extractJSON(input) {
    let array = input.split('');
    let opening_braces = 0, closing_braces = 0, start_pos = 0, end_pos = 0;
    
    for (let i = 0; i < array.length; i++) {
        if (array[i] == '{') {
            opening_braces++;
    
            if (opening_braces == 1) {
                start_pos = i;
            }
        }
        if (array[i] == '}') {
            closing_braces++;
            if (closing_braces == opening_braces) {
                end_pos = i;
                break;
            }
        }
    }
    
    if (start_pos == 0 && end_pos == 0) {
        return;
    }  
    
    array.splice(0, start_pos);
    array.splice(end_pos, array.length);
    
    return input.substring(start_pos, end_pos+1);
}

function getRekordboxPath() {
    let temp;

    temp = PROCESS.env.APPDATA + PATH.sep + "Pioneer" + PATH.sep + "rekordbox" + PATH.sep + "beatport" + PATH.sep
    temp += FS.readdirSync(temp)[0];
    temp += PATH.sep + "tr";

    return temp;
}