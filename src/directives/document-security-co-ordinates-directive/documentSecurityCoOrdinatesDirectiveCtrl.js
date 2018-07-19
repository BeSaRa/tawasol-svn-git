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
                                                                         LangWatcher,
                                                                         DocumentSecurityBarcodeBox,
                                                                         DocumentSecurityPage) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentSecurityCoOrdinatesDirectiveCtrl';
        LangWatcher($scope);

        self.documentSecurityPage = new DocumentSecurityPage();
        self.documentSecurityBarcodeBox = new DocumentSecurityBarcodeBox();

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

        self.getPageDimensions = function () {
            self.pageDimensions = self.documentSecurityPage.getCalculatedDimensions();
            return self.pageDimensions;
        };

        self.getBarcodeBoxDimensionsAndPosition = function () {
            return $timeout(function () {
                var calculatedValues = self.documentSecurityBarcodeBox.calculatePositionsAndDimensions(true, self.documentSecurityCopy.locationY2D, self.documentSecurityCopy.locationX2D, true);
                var calculatedValuesWithoutPixel = self.documentSecurityBarcodeBox.calculatePositionsAndDimensions(true, self.documentSecurityCopy.locationY2D, self.documentSecurityCopy.locationX2D, false);
                calculatedValues.top = (self.documentSecurityPage.cHeight - (calculatedValuesWithoutPixel.height + calculatedValuesWithoutPixel.top));
                self.barcodeBoxDimensionsAndPosition = calculatedValues;
                return self.barcodeBoxDimensionsAndPosition;
            })
        };

        self.getWatermarkTextClass = function () {
            return 'orientation-' + self.documentSecuritySetting.textOrientation;
        };

        self.getWatermarkTextStyle = function () {
            return {
                'font-size': self.documentSecuritySetting.textSize + 'px'
            };
        };

        $timeout(function () {
            self.makeDocumentSecurityCopy();
            self.getPageDimensions();
            self.getBarcodeBoxDimensionsAndPosition();
            self.getWatermarkTextClass();
            self.getWatermarkTextStyle();
        });
    });
};