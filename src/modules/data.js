var tracks = [];

module.exports = {
    Tracks: tracks,
    Add: (artist, title) => {
        tracks.push(artist + " - " + title);
        DOM.UI.Update();
    }
}

class Track {
    constructor(artist, title) {
        this.artist = artist;
        this.title = title;
    }
}