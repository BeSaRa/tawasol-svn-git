module.exports = function (app) {
    app.service('contextHelpService', function (dialog, langService) {
        'ngInject';
        var self = this;

        self.serviceName = 'contextHelpService';

        self.defaultHelpUrl = 'help/';
        self.defaultVideoHelpUrl = 'help_videos/';

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
                    controller: function ($compile, $scope, $element, $timeout, rootEntity) {
                        'ngInject';
                        if (!rootEntity.isQatarVersion()) {
                            var scope = $scope.$new(true);
                            scope.ctrl = {
                                url: self.defaultVideoHelpUrl + self.currentHelpID + '.mp4'
                            }
                            var link = $compile(angular.element('<help-videos-directive url="ctrl.url">'))(scope);
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
