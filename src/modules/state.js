// saves the id/counter of the track that is currently being edited
var is_editing, is_adding, is_add_above, is_add_below;

var Is = {};
Is.Editing = -1;
Is.Adding = false;
Is.AddAbove = false;
Is.AddBelow = false;

module.exports = {
    Editing: {
        Get: function() {
            return Is.Editing;
        },
        Set: function(val) {
            Is.Editing = val;
        }
    },
    Adding: {
        Get: function() {
            return Is.Adding;
        },
        Set: function(val) {
            Is.Adding = val;
        },
        Above: {
            Get: function() {
                return Is.AddAbove;
            },
            Set: function(val) {
                Is.AddAbove = val;
            }
        },
        Below: {
            Get: function() {
                return Is.AddBelow;
            },
            Set: function(val) {
                Is.AddBelow = val;
            }
        }
    },
    Reset: function() {
        Is.Editing = false;
        Is.Adding = false;
        Is.AddAbove = false;
        Is.AddBelow = false;
    }
}