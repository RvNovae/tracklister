const fs = require('fs');
const readline = require('readline');
const { clipboard } = require('electron');
var xml_js = require('xml-js');

document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();

    document.getElementById("copy_btn").disabled = false;
    document.getElementById('copy_btn').innerHTML = '<i class="far fa-copy"></i>';
    document.getElementById("tracklist").innerHTML = "";

    for (const f of e.dataTransfer.files) {
        convertFile(f.path);
    }
});

document.getElementById('copy_btn').addEventListener('click', function() {
    clipboard.writeText(document.getElementById('tracklist').innerText);
    this.innerHTML = '<i class="fas fa-copy"></i>';
});

document.getElementById('about_btn').addEventListener('click', function() {
    document.getElementById('about_modal').classList.add('is-active');
});

document.getElementsByClassName('modal-close')[0].addEventListener('click', function() {
    this.parentNode.classList.remove('is-active');
});
document.getElementsByClassName('modal-background')[0].addEventListener('click', function() {
    this.parentNode.classList.remove('is-active');
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
        default:
            alert('Unsupported file type! .m3u8, .nml and .csv are supported.')
            break;
    }
}

function m3u8(input_file) {
    var tracks = [];
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
            track = counter + ". " + line.split(',').pop();
            tracks.push(track);
            document.getElementById("tracklist").innerHTML += track + "<br/>";
        }
    })
}

function csv(input_file) {
    var tracks = [];
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
            track = counter + ". " + line.split('",', 1).shift().replace('"', '');
            tracks.push(track);
            document.getElementById("tracklist").innerHTML += track + "<br/>";
        }
    })
}

function nml(input_file) {
    var tracks = [];
    var counter = 0;
    var track;
    var json;
    var content;

    fs.readFile(input_file, 'utf8', function(err, contents) {
        json = xml_js.xml2json(contents, {compact: true, spaces: 4});
        content = JSON.parse(json);
        content.NML.COLLECTION.ENTRY.forEach(element => {
            counter += 1;
            track = counter + ". " + element._attributes.ARTIST + " - " + element._attributes.TITLE
            tracks.push(track);
            document.getElementById("tracklist").innerHTML += track + "<br/>";
        });
    }); 
}