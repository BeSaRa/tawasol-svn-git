module.exports = function (app) {
    app.controller('documentSecurityCoOrdinatesDirectiveCtrl', function ($scope,
                                                                         $rootScope,
                                                                         $timeout,
                                                                         $element,
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

        /**
         * @description Gets the barcode box's calculated dimensions and positions
         * @returns {*}
         */
        self.getBarcodeBoxDimensionsAndPosition = function () {
            return $timeout(function () {
                var calculatedValues = self.documentSecurityBarcodeBox.calculatePositionsAndDimensions(true, self.documentSecurityCopy.locationY2D, self.documentSecurityCopy.locationX2D, true);
                var calculatedValuesWithoutPixel = self.documentSecurityBarcodeBox.calculatePositionsAndDimensions(true, self.documentSecurityCopy.locationY2D, self.documentSecurityCopy.locationX2D, false);
                calculatedValues.top = (self.documentSecurityPage.cHeight - (calculatedValuesWithoutPixel.height + calculatedValuesWithoutPixel.top));
                self.barcodeBoxDimensionsAndPosition = calculatedValues;
                return self.barcodeBoxDimensionsAndPosition;
            })
        };

        /**
         * @description Gets the class to be used with watermark text
         * @returns {string}
         */
        self.watermarkTextClass = '';
        self.getWatermarkTextClass = function () {
            self.watermarkTextClass = 'orientation-' + self.documentSecuritySetting.textOrientation;
            return self.watermarkTextClass;
        };
        /**
         * @description Gets the style to be used for the text
         * @returns {{"font-size": string, "margin-left": string}}
         */
        self.watermarkTextStyle = {};
        self.getWatermarkTextStyle = function () {
            self.watermarkTextStyle = {
                'font-size': self.documentSecuritySetting.textSize * self.documentSecurityBarcodeBox.whRatio + 'px',
                'margin-left': -($element.find('#security-text').width() / 2) + 'px',
                'opacity': (self.documentSecurity.opacity * 0.1)
            };
            return self.watermarkTextStyle;
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