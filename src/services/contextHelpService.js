module.exports = function (app) {
    app.service('contextHelpService', function (dialog, langService) {
        'ngInject';
        var self = this;

        self.serviceName = 'contextHelpService';

        self.defaultHelpUrl = 'help/';

        self.currentHelpUrl = null;

        self.setHelpTo = function (helpID) {
            self.currentHelpUrl = self.defaultHelpUrl + helpID;
        };
        /**
         * display popup for
         */
        self.openContextHelp = function ($event) {
            return dialog
                .showDialog({
                    templateUrl: self.currentHelpUrl + '_' + langService.current + '_help.html',
                    targetEvent: $event || false
                })
                .then(function () {

                })
                .catch(function () {

                });
        }

    })
};