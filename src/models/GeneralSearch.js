module.exports = function (app) {
    app.factory('GeneralSearch', function (CMSModelInterceptor,
                                           Correspondence,
                                           langService) {
        return function GeneralSearch(model) {
            var self = this;

            Correspondence.call(this);
            self.docClassName = 'Correspondence';
            self.classDescription = 'Correspondence';

            self.approveDateFrom = null;
            self.approveDateTo = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            GeneralSearch.prototype.getTranslatedYesNo = function (fieldName) {
                return self[fieldName] ? langService.get('yes') : langService.get('no');
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('GeneralSearch', 'init', this);
        }
    })
};