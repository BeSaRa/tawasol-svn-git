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
    })
};