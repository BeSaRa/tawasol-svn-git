module.exports = function (app) {
    app.controller('gridIndicatorDirectiveCtrl', function ($q,
                                                         $scope,
                                                         langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'gridIndicatorDirectiveCtrl';
        self.langService = langService;

        /**
         * @description Checks if indicator will be displayed or not
         * @returns {boolean}
         */
        self.isShowIndicator = function() {
            return !self.showIndicator;
        };

    });
};