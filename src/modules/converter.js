const MM = require('music-metadata');
const FS = require('fs');
const READLINE = require('readline');
const XML_JS = require('xml-js');
const UTIL = require('util');

module.exports = {
    Start: function(inputFile) {
        // extract extension from file name
        var extension = inputFile.split('.').pop();
        extension = extension.toLowerCase();
        // call conversion function based on extension
        switch (extension) {
            case 'm3u8':
                m3u8(inputFile);
                break;
            case 'nml':
                nml(inputFile);
                break;
            case 'csv':
                csv(inputFile);
                break;
            case 'm3u':
                m3u(inputFile);
                break;
            // audio files
            case 'wav':
            case 'mp3':
            case 'flac':
            case 'aiff':
            case 'aif':
            case 'aac':
            case 'ogg':
            case 'wma':
            case 'alac':  
            case 'm4a':  
                audio(inputFile);
                break;
            default:
                alert('Unsupported file type! .m3u8, .nml, .csv, .m3u and audio files are supported.');
                break;
        }
    }
}

// this function handles .m3u8 files
// these .m3u8 files must have been exported by Rekordbox 
// interpretations differ from program to program
function m3u8(inputFile) {
    // declare counter and track
    var counter = Data.Tracks.length;
    var track;
    // create a readline filestream, in order to read the file line by line
    const rl = READLINE.createInterface({
        input: FS.createReadStream(inputFile),
        output: process.stdout,
        console: false
    });
    // iterate through every line
    rl.on('line', function(line) {
        // example of a line containing useful data:
        // #EXTINF:269,LU-I - Swallow tail
        // everything interesting is stored after a comma
        // if there is no comma, there is nothing interesting in that line
        if (RegExp("#EXTINF:").test(line)) {
            // if found
            // increase the counter
            counter += 1;
            // attempt to split the track at the first comma
            // extract everything after the comma
            try {
                var temp = line.split(',', 1).shift() + ',';
                track = line.replace(temp, '');
            }
            // display an error for the file that could not be gathered properly
            // assume that the file has been not been tagged properly
            catch {
                track = "###Error, is this file tagged properly?";
            }
            // append the extracted to the tracks array
            Data.Tracks.push(track);
            // write the track
            var ignored = DOM.Write.Track(track, counter);
            // if it does not pass, the counter has to be decreased to account for the missing track
            if (ignored == 0) {counter--}
        }
    })
}

// this function handles .csv files
// these .csv files must have been exported by Serato 
// interpretations differ from program to program
function csv(inputFile) {
    // declare counter, line_counter and track
    var counter = Data.Tracks.length;
    var line_counter = 0;
    var track;
    // create filestream in order to read the file line by line
    const rl = READLINE.createInterface({
        input: FS.createReadStream(inputFile),
        output: process.stdout,
        console: false
    });
    // iterate through every line
    rl.on('line', function(line) {
        // the first three lines in Serato's .csv files are essentially useless
        // this makes sure they are skipped
        line_counter += 1; 
        if (line_counter > 2) {
            // increase the track counter
            counter += 1;
            // example of a line
            // "Audiofreq - Dance 2 Music (Extended Mix)","16:56:00","17:01:45","00:05:45","1",""
            // everything before the first '",' contains the trackname
            // extract that and replace the '"' at the beginning
            try {
                track = line.split('",', 1).shift().replace('"', '');
            }
            // if the track is not tagged properly this may cause issues 
            // set the track to an error string
            catch {
                track = "###Error, is this file tagged properly?";
            }
            // append the track to the tracks array
            Data.Tracks.push(track);
            // write the track
            var ignored = DOM.Write.Track(track, counter);
            // if it does not pass, the counter has to be decreased to account for the missing track
            if (ignored == 0) {counter--}
        }
    })
}

// this function handles .nml files
// these .nml files must have been exported by Traktor 
// interpretations differ from program to program
function nml(input_file) {
    // declare some variables
    var counter = Data.Tracks.length;
    var track;
    var json;
    var content;
    // because .nml is essentially xml, we can read the entire file as one
    FS.readFile(input_file, 'utf8', function(err, contents) {
        // convert the xml to json 
        json = XML_JS.xml2json(contents, {compact: true, spaces: 4});
        // parse the json into a javascript object
        content = JSON.parse(json);
        // iterate through all 'Entry' elements 
        content.NML.COLLECTION.ENTRY.forEach(element => {
            // increase counter
            counter += 1;
            // extract data from the artist and title column
            // save to the track variable
            try {
                track = element._attributes.ARTIST + " - " + element._attributes.TITLE
            }
            // if the track is not tagged properly, this may cause issues
            // set track to an error message
            catch {
                track = "###Error, is this file tagged properly?";
            }
            // write track
            var ignored = DOM.Write.Track(track, counter);
            // if it does not pass, the counter has to be decreased to account for the missing track
            if (ignored == 0) {counter--}
        });
    }); 
}

// this function handles .m3u files
// these .m3u files must have been exported by VirtualDJ (Traktor's .m3u will not work!)
// interpretations differ from program to program
function m3u(input_file) {
    // declare variables
    var counter = Data.Tracks.length;
    var track;
    // create filestream to read the file line by line
    const rl = READLINE.createInterface({
        input: FS.createReadStream(input_file),
        output: process.stdout,
        console: false
    });
    // iterate through every line
    rl.on('line', function(line) {
        // lines containing interesting data in VDJ's .m3u files look like this:
        // #EXTVDJ:<time>18:51</time><lastplaytime>1562431872</lastplaytime><filesize>14509227</filesize><artist>SPIT</artist><title>Check This</title>
        // Because they all start with #EXTVDJ, we only check lines containing that phrase
        if (RegExp("#EXTVDJ").test(line)) {
            // increase counter
            counter += 1;
            // extract everything that is contained between <artist> and </artist> and <title> and </title>
            // merge them together into the track name
            try {
                track = line.match(new RegExp('<artist>(.*)</artist>')).pop() + 
                ' - ' + line.match('<title>(.*)</title>').pop(); 
            }
            // If the track is not tagged properly, those tags can't be found in the line
            // ==> set track to error message
            catch {
                track = "###Error, is this file tagged properly?";
            }
            // write track
            var ignored = DOM.Write.Track(track, counter);
            // if it does not pass, the counter has to be decreased to account for the missing track
            if (ignored == 0) {counter--}
        }
    });
}

// when an audio file is dropped -> get metadata / filename
function audio(input_file) {

    MM.parseFile(input_file, {native: false})
        .then(metadata => {
            var track = '';
            var artist = UTIL.inspect(metadata.common.artist, {showHidden : false, depth : null});
            if (artist == '') { UTIL.inspect(metadata.common.artists, {showHidden : false, depth : null}); }

            var title = UTIL.inspect(metadata.common.title, {showHidden : false, depth : null});

            artist = artist.substr(1, artist.length -2);
            title = title.substr(1, title.length -2);

            if (artist && title && artist != 'ndefine' && title != 'ndefine') {
                track = artist + ' - ' + title;
            }   
            else {
                track = input_file.replace(/^.*[\\\/]/, '').split('.').slice(0, -1).join('.');
            }
            Data.Tracks.push(track);
            DOM.UI.Update();
            console.log(Data.Tracks);
        })
        .catch ( err => {
            console.error(err.message);
        })
}