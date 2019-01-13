module.exports = function (app) {
    app.service('helper', function () {
        'ngInject';
        var self = this;
        self.move = function (array, old_index, new_index) {
            if (new_index >= array.length) {
                var k = new_index - array.length;
                while ((k--) + 1) {
                    array.push(undefined);
                }
            }
            array.splice(new_index, 0, array.splice(old_index, 1)[0]);
            return array;
        };

        self.closest = function (el, fn) {
            return el && ((fn(el) && el !== document.querySelector('org-chart')) ? el : self.closest(el.parentNode, fn));
        };

        self.findDuplicateInArray = function (array) {
            var object = {};
            var result = [];

            array.forEach(function (item) {
                if (!object[item])
                    object[item] = 0;
                object[item] += 1;
            });

            for (var prop in object) {
                if (object[prop] >= 2) {
                    result.push(prop);
                }
            }
            return result;
        }
    })
};
