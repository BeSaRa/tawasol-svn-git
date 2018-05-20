module.exports = function (app) {
    app.factory('BarcodeSetting', function (CMSModelInterceptor) {
        'ngInject';
        return function BarcodeSetting(model) {
            var self = this;
            self.fontSize = null;
            self.width = null;
            self.height = null;
            self.encodeType = null;
            self.barcodeText = null;
            self.barcodeLabelLoc = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            BarcodeSetting.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            BarcodeSetting.prototype.setFontSize = function (fontSize) {
                this.fontSize = fontSize;
                return this;
            };
            BarcodeSetting.prototype.setWidth = function (width) {
                this.width = width;
                return this;
            };
            BarcodeSetting.prototype.setHeight = function (height) {
                this.height = height;
                return this;
            };
            BarcodeSetting.prototype.setEncodeType = function (encodeType) {
                this.encodeType = encodeType;
                return this;
            };
            BarcodeSetting.prototype.setBarcodeText = function (barcodeText) {
                this.barcodeText = barcodeText;
                return this;
            };
            BarcodeSetting.prototype.setBarcodeLabelLoc = function (barcodeLabelLoc) {
                this.barcodeLabelLoc = barcodeLabelLoc;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('BarcodeSetting', 'init', this);
        }
    })
};