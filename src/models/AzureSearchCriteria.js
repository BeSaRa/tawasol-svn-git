module.exports = function (app) {
    app.factory('AzureSearchCriteria', function (CMSModelInterceptor) {
        'ngInject';
        return function AzureSearchCriteria(model) {
            var self = this;
            self.keyWords = null;
            self.fromDate = null;
            self.toDate = null;
            self.docSubjectSrc = null;
            self.docType = [];
            self.mainClassification = [];
            self.subClassification = [];
            self.ou = [];
            self.registryOU = [];
            self.securityLevel = [];
            self.docClassId = [];
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            AzureSearchCriteria.prototype.toFacetCriteria = function () {
                var criteria = angular.copy(this);
                delete criteria.keyWords
                delete criteria.fromDate;
                delete criteria.toDate;
                return criteria;
            }

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('AzureSearchCriteria', 'init', this);
        }
    })
};
