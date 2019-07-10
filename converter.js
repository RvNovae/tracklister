const fs = require('fs');
const readline = require('readline');
const { clipboard, app, shell } = require('electron');
const xml_js = require('xml-js');
const arrayMove = require('array-move');
const storage = require('electron-json-storage');

var tracks = [];
var is_editing;

let settings = {

};
try {
    settings_load();
}
catch {
    settings_reset();
}

function settings_load() {
    fs.access(storage.getDataPath('settings'), (err) => {
        if (err) {
            settings_reset();
        }
        storage.get('settings', function(err, data) {
            if (err) throw error;
            settings = data;

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

function settings_reset() {
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

    storage.set('settings', settings, function(err) {
        if (err) throw error;   
    });
    settings_load();
}

function settings_save() {
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

    storage.set('settings', settings, function(err) {
        if (err) throw error;
    });

    document.getElementById('settings_modal').classList.remove('is-active');
    updateUI();
}

document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    setUI();

    for (const f of e.dataTransfer.files) {
        convertFile(f.path);
    }
    tracks.forEach(function(entry) {
        document.getElementById("tracklist").innerHTML += entry + "<br/>";
    });
});

function setUI() {
    document.getElementById("copy_btn").disabled = false;
    document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
    document.getElementById("tracklist").innerHTML = "";
    document.getElementById("pure_text").innerHTML = "";
    tracks.length = 0;
}

function resetUI() {
    document.getElementById("copy_btn").disabled = true;
    document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
    document.getElementById("tracklist").innerHTML = "";
    document.getElementById("pure_text").innerHTML = "";
    tracks.length = 0;
}

document.getElementById('copy_btn').addEventListener('click', function() {
    clipboard.writeText(document.getElementById('pure_text').innerText);
    this.innerHTML = '<i class="fas fa-copy"></i>';
});

function close_modal(id) {
    document.getElementById(id).classList.remove('is-active');
}

function open_modal(id) {
    document.getElementById(id).classList.add('is-active');
}

Array.from(document.getElementsByClassName('modal-background')).forEach(function(element) {
    element.addEventListener('click', function() {
        element.parentNode.classList.remove('is-active');
    });
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    //open_modal('drop_modal');
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    //close_modal('drop_modal');
});

function convertFile(input_file) {
    var extension = input_file.split('.').pop();

    switch (extension) {
        case 'm3u8':
            m3u8(input_file);
            break;
        case 'nml':
            nml(input_file);
            break;
        case 'csv':
            csv(input_file);
            break;
        case 'm3u':
            m3u(input_file);
            break;
        default:
            alert('Unsupported file type! .m3u8, .nml, .csv and .m3u are supported.');
            resetUI();
            break;
    }
}

function toggle_dropdown(element, id) {
    element.parentNode.parentNode.classList.toggle('is-active');
}

function updateUI() {
    var counter = 0;
    document.getElementById("tracklist").innerHTML = "";
    document.getElementById("pure_text").innerHTML = "";
    document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';

    tracks.forEach(function (track) {
        counter++;
        writeTrack(track, counter);
    });
}

function delete_track(element, id) {
    tracks.splice(id-1, 1);
    updateUI();
}

function set_promo(element, id) {
    tracks[id-1] = settings.promo;
    updateUI();
}

function edit_track(element, id) {
    document.getElementById('edit_input').value = tracks[id-1];
    is_editing = id;
    document.getElementById('edit_modal').classList.add('is-active');
}

function edit_save() {
    tracks[is_editing-1] = document.getElementById('edit_input').value;
    document.getElementById('edit_modal').classList.remove('is-active');
    updateUI();
}

function filter_ignore(track, counter) {
    if (!settings.ignore.switch) {
        return true;
    }
    if (RegExp(',').test(RegExp.escape(settings.ignore.keywords))) {
        settings.ignore.keywords.split(',').forEach(function (keyword) {
            if ((new RegExp(RegExp.escape(keyword), 'gi')).test(track)) {
                tracks.splice(counter-1, 1);
                return false;
            }
            else {
                return true;
            }
        });
    }
    else {
        if (settings.ignore.keywords == '') {
            return true;
        }
        else {
            if ((new RegExp(RegExp.escape(settings.ignore.keywords), 'gi')).test(track)) {
                tracks.splice(counter-1, 1);
                return false;
            }
            else {
                return true;
            }
        }
    }
}

function filter_syntax(track) {
    if (!settings.syntax.switch) {
        return track;
    }
    if (settings.syntax.featuring != '') {
        try{
            track = track.replace(new RegExp('( featuring | ft | ft\. | feat | feat\. )', 'gi'), ' ' + settings.syntax.featuring + ' ');
        }
        catch {}
    }
    if (settings.syntax.versus != '') {
        try {
            track = track.replace(new RegExp('( versus | vs | vs\. )', 'gi'), ' ' + settings.syntax.versus + ' ');
        }
        catch {}
    }
    if (settings.syntax.and != '') {
        try {
            track = track.replace(new RegExp('( and | & | \\+ )', 'i'), ' ' + settings.syntax.and + ' ');
        }
        catch {}
    }
    return track;
}

function filter_feature_fix(track) {
    if (!settings.featured_fix.switch) {
        return track;
    }
    var artist = track.split(' - ').shift();
    var title = track.split(' - ').pop();
    try {
        var feature = title.match(new RegExp('( featuring | ft | ft\. | feat | feat\. )(.*)', 'gi')).pop();
        title = title.replace(feature, '');
        artist += " " + feature;
    }
    catch {}
    return artist + ' - ' + title;
}

function filter_omit(track) {
    if (!settings.omit.switch) {
        return track;
    }
    else {
        if (settings.omit.keywords == '') {
            return track;
        }
        else {
            try {
                settings.omit.keywords.split(',').forEach(function(keyword) {
                    track = track.replace(RegExp(RegExp.escape(keyword), 'gi'), '');
                }); 
                return track;
            }
            catch {
                return track;
            }
        }
    }
}

RegExp.escape = function(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function filter(track, id) {
    track = filter_feature_fix(track);
    track = filter_syntax(track);
    track = filter_omit(track);
    if (filter_ignore(track, id)) {
        tracks[id-1] = track;
        console.log('track passed');
        return track;
    }
    else {
        console.log('track did not pass');
        return false;
    }
}

function move_up(element, id) {
    if (id-1 < 1) {

    }
    else {
        tracks = arrayMove(tracks, id-1, id-2);
        updateUI();
    }
}

function move_down(element, id) {
    if (id-1 > tracks.length-1) {

    }
    else {
        tracks = arrayMove(tracks, id-1, id);
        updateUI();
    }
}

function writeTrack(track, counter) {
    track = filter(track, counter);
    if (!track) {
        return 0;
    }
    tracks[counter-1] = track;
    document.getElementById('tracklist').innerHTML += `
        <div class="dropdown">
            <div class="dropdown-trigger">
                <button onclick="toggle_dropdown(this, `+counter+`)" class="button is-small is-white dropdown-trigger-btn" aria-haspopup="true" id="dropdown-`+counter+`">
                    <span class="icon is-small">
                        <i class="fas fa-angle-down" aria-hidden="true"></i>
                    </span>
                </button>
            </div>
            <div class="dropdown-menu" id="dropdown-`+counter+`" role="menu">
                <div class="dropdown-content">
                    <a href="#" onclick="delete_track(this, `+counter+`)" class="dropdown-item has-text-danger">
                        <i class="fas fa-eraser"></i> Delete
                    </a>
                    <hr class="dropdown-divider">
                    <a href="#" onclick="set_promo(this, `+counter+`)" class="dropdown-item has-text-warning">
                        <i class="fas fa-asterisk"></i> Set to Promo
                    </a>
                    <a href="#" onclick="edit_track(this, `+counter+`)" class="dropdown-item">
                        <i class="fas fa-edit"></i> Edit
                    </a>
                    <hr class="dropdown-divider">
                    <a href="#" onclick="move_up(this, `+counter+`)" class="dropdown-item">
                        <i class="fas fa-angle-up"></i> Move Up 
                    </a>
                    <a href="#" onclick="move_down(this, `+counter+`)" class="dropdown-item">
                        <i class="fas fa-angle-down"></i> Move Down
                    </a>
                </div>
            </div>
        </div>
    ` +
    counter + '. ' + track + '<br/>';
    document.getElementById('pure_text').innerHTML += counter + '. ' + track + '\n';
}

function m3u8(input_file) {
    var counter = 0;
    var track;

    const rl = readline.createInterface({
        input: fs.createReadStream(input_file),
        output: process.stdout,
        console: false
    });
 
    rl.on('line', function(line) {
        if (RegExp(",").test(line)) {
            counter += 1;
            try {
                track = line.split(',').pop();
            }
            catch {
                track = "###Error, is this file tagged properly?";
            }
            tracks.push(track);
            //document.getElementById("tracklist").innerHTML += track + "<br/>";
            var ignored = writeTrack(track, counter);
            if (ignored == 0) {counter--}
        }
    })
}

function csv(input_file) {
    var counter = 0;
    var line_counter = 0;
    var track;

    const rl = readline.createInterface({
        input: fs.createReadStream(input_file),
        output: process.stdout,
        console: false
    });

    rl.on('line', function(line) {
        line_counter += 1; 
        if (line_counter > 2) {
            counter += 1;
            try {
                track = line.split('",', 1).shift().replace('"', '');
            }
            catch {
                track = "###Error, is this file tagged properly?";
            }
            tracks.push(track);
            var ignored = writeTrack(track, counter);
            if (ignored == 0) {counter--}
        }
    })
}

function nml(input_file) {
    var counter = 0;
    var track;
    var json;
    var content;

    fs.readFile(input_file, 'utf8', function(err, contents) {
        json = xml_js.xml2json(contents, {compact: true, spaces: 4});
        content = JSON.parse(json);
        content.NML.COLLECTION.ENTRY.forEach(element => {
            counter += 1;
            try {
                track = element._attributes.ARTIST + " - " + element._attributes.TITLE
            }
            catch {
                track = "###Error, is this file tagged properly?";
            }
            var ignored = writeTrack(track, counter);
            if (ignored == 0) {counter--}
        });
    }); 
}

function m3u(input_file) {
    var counter = 0;
    var track;

    const rl = readline.createInterface({
        input: fs.createReadStream(input_file),
        output: process.stdout,
        console: false
    });
 
    rl.on('line', function(line) {
        if (RegExp("#EXTVDJ").test(line)) {
            counter += 1;
            try {
                track = line.match(new RegExp('<artist>(.*)</artist>')).pop() + 
                ' - ' + line.match('<title>(.*)</title>').pop(); 
            }
            catch {
                track = "###Error, is this file tagged properly?";
            }
            var ignored = writeTrack(track, counter);
            if (ignored == 0) {counter--}
        }
    });
}