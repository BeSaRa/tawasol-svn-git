module.exports = function (app) {
    app.controller('searchFilterDirectiveCtrl', function () {
        'ngInject';
        var self = this;
        self.controllerName = 'searchFilterDirectiveCtrl';

        self.closeStatus = true;

        self.changeCallback = function () {
            if (typeof self.onChange === 'function') {
                self.onChange(self.model);
            }
        };

        self.checkLength = function () {
            if (!self.model.length && typeof  self.cancelCallback === 'function') {
                self.cancelCallback();
            }
        }

    });
};