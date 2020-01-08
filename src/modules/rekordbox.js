const PATH = require('path');
const firstline = require('firstline');

module.exports = {
    monitor: function (path) {
        fs.readdir(path, function(err, files) {
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }
            else { /*console.log ("Scanning: " + rekordbox_path);*/ }
    
            files.forEach(function(file) {
                let result = firstline(PATH.join(path, file));
    
                result.then(
                    function(resolve) {
    
                        var array = resolve.split('');
                        var opening_braces = 0, closing_braces = 0, start_pos = 0, end_pos = 0;
    
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
                        
                        //var clean = array.join('');
                        var clean = resolve.substring(start_pos, end_pos+1);
                        var object = JSON.parse(clean);
    
                        if (object.id == last_rekordbox_id) {
                            return;
                        }
                        else {
                            last_rekordbox_id = object.id;
                            console.log(object);
                            
                            var artist = "", title = "";
                            
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
                            if (object.remixers.length > 0) {
                                title = object.name + ' (' + object.mix_name + ')';
                            }
                            else {
                                title = object.name;
                            }
    
                            console.log(artist + " - " + title);
                            document.getElementById('bl_current').innerHTML = artist + " - " + title;
                        }
                        
                    },
                    function(error) {
                        console.log("The promise could not be resolved.");
                    }
                )
                return;
            });
        });
    }
}
