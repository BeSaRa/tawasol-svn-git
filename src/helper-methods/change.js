module.exports = (function () {
    "use strict";

    String.prototype.change = function () {
        var self = this;
        if (!arguments.length)
            return self;

        var replaced = self;

        for (var key in arguments[0]) {
            var value = (typeof arguments[0][key] !== undefined && arguments[0][key] !== null) ? arguments[0][key] : "";
            var regex = new RegExp(":" + key, 'g');
            var regex2 = new RegExp(":" + key, 'g');
            replaced = replaced.replace(regex, value);
            replaced = replaced.replace(regex2, value);
        }
        return replaced;
    };

    String.prototype.addLineBreak = function (data) {
        var string = this;
        string = string + '<br />';
        if (data) {
            string += data;
        }
        return string;
    };

})();