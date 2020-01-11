// this little function ensures that keywords entered by the user can contain special characters
// otherwise special characters might engage regex syntax
module.exports = {
    RegExp: {
        Escape: function(string) {
            return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        }
    }
}

