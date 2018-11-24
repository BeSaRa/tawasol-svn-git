module.exports = function (app) {
    app.controller('searchFilterDirectiveCtrl', function ($rootScope) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchFilterDirectiveCtrl';

        self.closeStatus = true;

        self.changeCallback = function () {
            // TODO: broadcast an event to tell the listeners the user click on search or enter
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