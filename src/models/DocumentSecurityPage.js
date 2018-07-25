module.exports = function (app) {
    app.factory('DocumentSecurityPage', function (CMSModelInterceptor,
                                                  langService) {
        'ngInject';
        return function DocumentSecurityPage(model) {
            var self = this;
            self.type = 'A4';
            self.whRatio = .64;

            self.width = 816;
            self.widthPx = 816 + 'px';

            self.height = 1056;
            self.heightPx = 1056 + 'px';

            self.cWidth = Math.round(self.width * self.whRatio);
            self.cWidthPx = self.cWidth + 'px';

            self.cHeight = Math.round(self.height * self.whRatio);
            self.cHeightPx = self.cHeight + 'px';


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            DocumentSecurityPage.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Returns the dimensions of barcode box
             * @param withPixels
             * @returns {*}
             */
            DocumentSecurityPage.prototype.getOriginalDimensions = function (withPixels) {
                if (withPixels)
                    return {width: self.width + 'px', height: self.height + 'px'};
                return {width: self.width, height: self.height};
            };

            DocumentSecurityPage.prototype.getCalculatedDimensions = function (withPixels) {
                if (withPixels)
                    return {width: self.cWidth + 'px', height: self.cHeight + 'px'};
                return {width: self.cWidth, height: self.cHeight};
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DocumentSecurityPage', 'init', this);
        }
    })
};