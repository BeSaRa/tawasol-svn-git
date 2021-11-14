module.exports = function (app) {
    app.service('contextHelpService', function (dialog, langService) {
        'ngInject';
        var self = this;

        self.serviceName = 'contextHelpService';

        self.defaultHelpUrl = 'help/';

        self.currentHelpUrl = null;
        self.currentHelpID = null;

        self.excludedControllers = [
            'documentsNotifyDirectiveCtrl'
        ];

        self.setHelpTo = function (helpID, excludeMe) {
            if (excludeMe) {
                return;
            }
            self.currentHelpID = helpID;
            self.currentHelpUrl = self.defaultHelpUrl + helpID;
        };
        /**
         * display popup for
         */
        self.openContextHelp = function ($event) {
            return dialog
                .showDialog({
                    templateUrl: self.currentHelpUrl + '_' + langService.current + '_help.html',
                    targetEvent: $event || false,
                    controller: function ($compile, $element, $timeout, configurationService) {
                        if (!configurationService.G2G_QATAR_SOURCE) {
                            var link = document.createElement('a');
                            link.innerText = langService.get('explanation_video');
                            link.href = 'help_videos/' + self.currentHelpID + '.mp4';
                            link.target = "_blank";
                            $timeout(function () {
                                angular.element($element[0].querySelector('md-content')).prepend(link);
                            })
                        }
                    },
                    controllerAs: "ctrl"
                })
                .then(function () {

                })
                .catch(function () {

                });
        }

    })
};
