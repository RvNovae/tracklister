const fs = require('fs');
const readline = require('readline');
const { clipboard } = require('electron');
const{ shell } = require('electron');
var xml_js = require('xml-js');

var tracks = [];

document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    resetUI();

    for (const f of e.dataTransfer.files) {
        convertFile(f.path);
    }
    if (tracks.length == 0) {
        alert("No tracks found in" + f.path + ". Either this file is empty or it has not been exported from the correct software.");
    }
});

function resetUI() {
    document.getElementById("copy_btn").disabled = false;
    document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
    document.getElementById("tracklist").innerHTML = "";
}

document.getElementById('copy_btn').addEventListener('click', function() {
    clipboard.writeText(document.getElementById('tracklist').innerText);
    this.innerHTML = '<i class="fas fa-copy"></i>';
});

document.getElementById('about_btn').addEventListener('click', function() {
    document.getElementById('about_modal').classList.add('is-active');
});
document.getElementById('fileguide_btn').addEventListener('click', function() {
    document.getElementById('fileguide_modal').classList.add('is-active');
});

Array.from(document.getElementsByClassName('modal-close')).forEach(function(element) {
    element.addEventListener('click', function() {
        element.parentNode.classList.remove('is-active');
    });
});
Array.from(document.getElementsByClassName('modal-background')).forEach(function(element) {
    element.addEventListener('click', function() {
        element.parentNode.classList.remove('is-active');
    });
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
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
                track = counter + ". " + line.split(',').pop();
            }
            catch {
                track = counter + ". " + line.split('",', 1).shift().replace('"', '');
            }
            tracks.push(track);
            document.getElementById("tracklist").innerHTML += track + "<br/>";
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
                track = counter + ". " + line.split('",', 1).shift().replace('"', '');
            }
            catch {
                track = counter + ". ###Error, is this file tagged properly?";
            }
            tracks.push(track);
            document.getElementById("tracklist").innerHTML += track + "<br/>";
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
                track = counter + ". " + element._attributes.ARTIST + " - " + element._attributes.TITLE
            }
            catch {
                track = counter + ". ###Error, is this file tagged properly?";
            }
            tracks.push(track);
            document.getElementById("tracklist").innerHTML += track + "<br/>";
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
                track = counter + ". " + 
                line.match(new RegExp('<artist>(.*)</artist>')).pop() + 
                ' - ' + line.match('<title>(.*)</title>').pop(); 
            }
            catch {
                track = counter + ". ###Error, is this file tagged properly?";
            }
            tracks.push(track);
            document.getElementById("tracklist").innerHTML += track + "<br/>";
        }
    });
}