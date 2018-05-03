module.exports = function (app) {
    app.factory('CorrespondenceSiteView', function (CMSModelInterceptor,
                                                    langService,
                                                    Information,
                                                    _) {
        'ngInject';
        return function CorrespondenceSiteView(model) {
            var self = this;
            self.id = null;
            self.exactId = null;
            self.parent = null;
            self.isGlobal = null;
            self.arName = null;
            self.enName = null;
            self.status = null;
            self.arDisplayName = null;
            self.enDisplayName = null;
            self.sourceType = null;
            self.ouId = null;
            self.code = null;
            self.correspondenceSiteTypeId = null;
            self.parentInfo = new Information();

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];
            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            CorrespondenceSiteView.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            CorrespondenceSiteView.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('CorrespondenceSiteView', 'init', this);
        }
    })
};