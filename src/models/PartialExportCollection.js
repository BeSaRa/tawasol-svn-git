module.exports = function (app) {
    app.factory('PartialExportCollection', function (CMSModelInterceptor, PartialExport) {
        'ngInject';
        return function PartialExportCollection(model) {
            var self = this, PartialExportSelective;
            PartialExport.call(this);
            self.exportOptions = {
                ATTACHMENTS: false,
                RELATED_BOOKS: false,
                RELATED_OBJECTS: false
            };
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            PartialExportCollection.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            PartialExportCollection.prototype.setPartialExportSelective = function (model) {
                PartialExportSelective = model;
                return this;
            };

            PartialExportCollection.prototype.changeExportType = function () {
                return (new PartialExportSelective()).setSitesCCList(this.sitesCCList).setSitesToList(this.sitesToList)
            };

            PartialExportCollection.prototype.getDetails = function () {
                return {
                    url: 'partial-export',
                    interceptor: 'PartialExportCollection'
                };
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PartialExportCollection', 'init', this);
        }
    })
};