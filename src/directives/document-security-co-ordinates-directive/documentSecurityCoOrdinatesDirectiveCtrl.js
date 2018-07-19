module.exports = function (app) {
    app.controller('documentSecurityCoOrdinatesDirectiveCtrl', function ($scope,
                                                                         $rootScope,
                                                                         $timeout,
                                                                         _,
                                                                         $q,
                                                                         generator,
                                                                         DocumentSecurity,
                                                                         DocumentSecuritySetting,
                                                                         langService,
                                                                         LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentSecurityCoOrdinatesDirectiveCtrl';
        LangWatcher($scope);
        self.getWatermarkTextClass = function () {
            return 'direction-' + self.documentSecuritySetting.textOrientation;
        };

        self.getWatermarkTextStyle = function () {
            return {
                'font-size': self.documentSecuritySetting.textSize + 'px'/*,
                'top': self.barcodeSpecs.pageSettings.height / 2,
                'left': self.barcodeSpecs.pageSettings.width / 2*/
            };
        };

        self.makeDocumentSecurityCopy = function (override) {
            if (override) {
                self.documentSecurityCopy = angular.copy(self.documentSecurity);
            }
            else {
                if (!self.documentSecurityCopy) {
                    self.documentSecurityCopy = angular.copy(self.documentSecurity);
                }
            }
        };

        $timeout(function () {
            self.makeDocumentSecurityCopy();
            self.getWatermarkTextClass();
            self.getWatermarkTextStyle();
        });
    });
};