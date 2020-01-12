module.exports = {
    Process: function(track, id) {
        // modify the track by calling the different filters
        track = featureFix(track);
        track = syntax(track);
        track = omit(track);
        // if the track passes, save it to the array and return it
        if (ignore(track, id)) {
            Data.Tracks[id-1] = track;
            return track;
        }
        // if the track does not pass, return false
        else {
            return false;
        }
    }
}

// this filter returns true if the track passes the ignore list
// if it returns false, a match with one of the keywords has been found 
function ignore(track, counter) {
    try {
        // If this setting is disabled, return true / let the track pass
        if (!Settings.Get().ignore.switch) {
            return true;
        }
        // check if the keywords string contains any seperators (',')
        if (RegExp(',').test(Helper.RegExp.Escape(Settings.Get().ignore.keywords))) {
            // split the list of keywords by ',' and iterate through them
            Settings.Get().ignore.keywords.split(',').forEach(function (keyword) {
                // check if keyword is found in track name
                if ((new RegExp(Helper.RegExp.Escape(keyword), 'gi')).test(track)) {
                    // if a match is found => remove track from array and return false
                    Data.Tracks.splice(counter-1, 1);
                    return false;
                }
            });
        }
        // do this if no seperators (',') have been found in the keywords string
        else {
            // if keywords string is empty, let the track pass
            if (Settings.Get().ignore.keywords == '') {
                return true;
            }
            // if the keywords string is not empty
            // assume the keywords string only contains one keyword
            // check against the keyword
            else {
                // if a match is, remove the track from the array and let the track fail
                if ((new RegExp(Helper.RegExp.escape(Settings.Get().ignore.keywords), 'gi')).test(track)) {
                    Data.Tracks.splice(counter-1, 1);
                    return false;
                }
                // if no matches are found, let the track pass
                else {
                    return true;
                }
            }
        }
    }
    catch {
        return true;
    }
}
// this filter finds 'featuring', 'versus' and 'AND' conventions in track names
// it will then change them to the user's set preference
function syntax(track) {
    try {
        // if this setting is turned off => return the unmodified track
        if (!Settings.Get().syntax.switch) {
            return track;
        }
        // if the 'featuring' string is not empty =>
        // find and replace all instances with the set preference
        // try and catch are necessary in case it can't find any instances of these conventions
        // => save changes to the track variable
        if (Settings.Get().syntax.featuring != '') {
            try{
                track = track.replace(new RegExp('( featuring | ft | ft\. | feat | feat\. )', 'gi'), ' ' + Settings.Get().syntax.featuring + ' ');
            }
            catch (error) {
                console.log(error);
            }
        }
        // same for the 'versus' string
        if (Settings.Get().syntax.versus != '') {
            try {
                track = track.replace(new RegExp('( versus | vs | vs\. )', 'gi'), ' ' + Settings.Get().syntax.versus + ' ');
            }
            catch {}
        }
        // same for the 'AND' string
        if (Settings.Get().syntax.and != '') {
            try {
                track = track.replace(new RegExp('( and | & | \\+ )', 'i'), ' ' + Settings.Get().syntax.and + ' ');
            }
            catch {}
        }
        // when done, return the modified track
        return track;
    }
    catch {
        return track;
    }
}
// this filter will look for featuring tags in the title column
// and append them to the artist column
function featureFix(track) {
    // return unmodified track, if turned off
    try {
        if (!Settings.Get().featured_fix.switch) {
            return track;
        }
        // split track into artist and title column by looking for the ' - ' string
        var artist = track.split(' - ').shift();
        var title = track.split(' - ').pop();
        try {
            // attempt to match featuring tags in the title string
            // if found it will extract everything after the tag, including the tag itself
            // this info will be stored in the feature variable
            var feature = title.match(new RegExp('( featuring | ft | ft\. | feat | feat\. )(.*)', 'gi')).pop();
            // remove extracted string from the title column
            title = title.replace(feature, '');
            // append the feature string to the artist column
            artist += " " + feature;
        }
        catch {}
        // merge artist and title back together and return them
        return artist + ' - ' + title;
    }
    catch {
        return track
    }
}
// this filter looks for keywords in the track name 
// if a match is found, the phrase will be removed from the trackname
// difference to the ignore filter => track will not get deleted, if a match is found
// ==> track gets modified
function omit(track) {
    try {
        // return unmodified track if setting is turned off
        if (!Settings.Get().omit.switch) {
            return track;
        }
        else {
            // return unmodified track if the keyword list is empty
            if (Settings.Get().omit.keywords == '') {
                return track;
            }
            else {
                try {
                    // split the keywords string at (',') and iterate through them
                    Settings.Get().omit.keywords.split(',').forEach(function(keyword) {
                        // if a match is found it will be replaced with an empty string
                        track = track.replace(RegExp(Helper.RegExp.Escape(keyword), 'gi'), '');
                    });
                    // return the modified track 
                    return track;
                }
                // if no seperator has been found, assume there is only one keyword
                catch {
                    // if a match is found it will be replaced with an empty string
                    track = track.replace(RegExp(Helper.RegExp.Escape(Settings.Get().omit.keywords), 'gi'), '');
                    return track;
                }
            }
        }
    }
    catch {
        return track;
    }
}

// this is not a track filter but rather a filter for the counter itself
// hence it's strange placement
// function filter_tracknumber(counter) {
//     if (Settings.Get().tracknumber.switch) {
//         var counter_digits;
//         var highest_digits;
//         var temp_counter = counter;
//         var temp_tracklength = Data.Tracks.length;

//         if (counter >= 1) ++counter_digits;

//         while(temp_counter / 10 >= 1) {
//             temp_counter /= 10;
//             ++counter_digits;
//         }

//         if (Data.Tracks.length >= 1) ++highest_digits;

//         while(temp_tracklength / 10 >= 1) {
//             temp_tracklength /= 10;
//             ++highest_digits;
//         }
//         console.log(highest_digits);
//         console.log(counter_digits);
//         for (let index = 0; counter_digits < highest_digits; index++) {
//             counter = '0' + counter;
//             console.log('yay');
//         }
//     }

//     return counter
// }