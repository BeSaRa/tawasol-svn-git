module.exports = function (app) {
    app.service('contextHelpService', function (dialog, langService) {
        'ngInject';
        var self = this;

        self.serviceName = 'contextHelpService';

        self.defaultHelpUrl = 'help/';

        self.currentHelpUrl = null;

        self.excludedControllers = [
            'documentsNotifyDirectiveCtrl'
        ];

        self.setHelpTo = function (helpID, excludeMe) {
            if (excludeMe) {
                return;
            }
            console.log(helpID + '_ar_help.html');
            console.log(helpID + '_en_help.html');

            self.currentHelpUrl = self.defaultHelpUrl + helpID;
        };
        /**
         * display popup for
         */
        self.openContextHelp = function ($event) {
            console.log(self.currentHelpUrl + '_' + langService.current + '_help.html');
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
