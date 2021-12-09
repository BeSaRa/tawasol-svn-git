module.exports = function (app) {
    app.factory('DocumentSecurityBarcodeBox', function (CMSModelInterceptor,
                                                        langService) {
        'ngInject';
        return function DocumentSecurityBarcodeBox(model) {
            var self = this;

            self.whRatio = .64;

            self.width = 100;
            self.widthPx = self.width + 'px';

            self.height = 100;
            self.heightPx = self.height + 'px';

            self.cWidth = Math.round(self.width * self.whRatio);
            self.cWidthPx = self.cWidth + 'px';

            self.cHeight = Math.round(self.height * self.whRatio);
            self.cHeightPx = self.cHeight + 'px';

            self.top = 0;
            self.topPx = self.top + 'px';

            self.left = 0;
            self.leftPx = self.left + 'px';

            self.cTop = Math.round(self.top * self.whRatio);
            self.cTopPx = self.cTop + 'px';

            self.cLeft = Math.round(self.left * self.whRatio);
            self.cLeftPx = self.cLeft + 'px';

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            DocumentSecurityBarcodeBox.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Returns the dimensions of barcode box in original dimensions
             * @param withPixels
             * @returns {*}
             */
            DocumentSecurityBarcodeBox.prototype.getOriginalDimensions = function (withPixels) {
                if (withPixels)
                    return {width: self.widthPx, height: self.heightPx};
                return {width: self.width, height: self.height};
            };
            /**
             * @description Returns the position of barcode box in original dimensions
             * @param withPixels
             * @returns {*}
             */
            DocumentSecurityBarcodeBox.prototype.getOriginalPosition = function (withPixels) {
                if (withPixels)
                    return {top: self.topPx, left: self.leftPx};
                return {top: self.top, left: self.left};
            };

            /**
             * @description Returns the dimensions of barcode box in calculated dimensions
             * @param withPixels
             * @returns {*}
             */
            DocumentSecurityBarcodeBox.prototype.getCalculatedDimensions = function (withPixels) {
                if (withPixels)
                    return {width: self.cWidth + 'px', height: self.cHeight + 'px'};
                return {width: self.cWidth, height: self.cHeight};
            };

            /**
             * @description Returns the position of barcode box in calculated dimensions
             * @param withPixels
             * @returns {*}
             */
            DocumentSecurityBarcodeBox.prototype.getCalculatedPosition = function (withPixels) {
                if (withPixels)
                    return {top: self.cTop + 'px', left: self.cLeft + 'px'};
                return {top: self.cTop, left: self.cLeft};
            };

            /**
             * @description Returns the position of barcode box in calculated dimensions
             * @param outputSmallRatio
             * @param top
             * @param left
             * @param withPixels
             * @returns {*}
             */
            DocumentSecurityBarcodeBox.prototype.calculatePositionsAndDimensions = function (outputSmallRatio, top, left, withPixels) {
                var topCalculated, leftCalculated, widthCalculated, heightCalculated;
                if (outputSmallRatio) {
                    topCalculated = Math.round(top * self.whRatio);
                    leftCalculated = Math.round(left * self.whRatio);
                    widthCalculated = self.getCalculatedDimensions().width;
                    heightCalculated = self.getCalculatedDimensions().height;
                }
                else {
                    topCalculated = Math.round(top / self.whRatio);
                    leftCalculated = Math.round(left / self.whRatio);
                    widthCalculated = self.getOriginalDimensions().width;
                    heightCalculated = self.getOriginalDimensions().height;
                }
                if (withPixels) {
                    return {
                        top: topCalculated + 'px',
                        left: leftCalculated + 'px',
                        width: widthCalculated + 'px',
                        height: heightCalculated + 'px'
                    };
                }
                return {
                    top: topCalculated,
                    left: leftCalculated,
                    width: widthCalculated,
                    height: heightCalculated
                };
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentSecurityBarcodeBox', 'init', this);
        }
    })
};