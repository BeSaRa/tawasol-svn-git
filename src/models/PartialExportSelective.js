module.exports = function (app) {
    app.factory('PartialExportSelective', function (CMSModelInterceptor, _, PartialExport) {
        'ngInject';
        return function PartialExportSelective(model) {
            var self = this, PartialExportCollection;
            PartialExport.call(this);
            self.exportItems = {
                ATTACHMENTS: [],
                RELATED_BOOKS: [],
                RELATED_OBJECTS: []
            };
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            PartialExportSelective.prototype.setPartialExportCollection = function (model) {
                PartialExportCollection = model;
                return this;
            };
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            PartialExportSelective.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            PartialExportSelective.prototype.changeExportType = function () {
                return (new PartialExportCollection()).setSitesCCList(this.sitesCCList).setSitesToList(this.sitesToList)
            };
            PartialExportSelective.prototype.getDetails = function () {
                return {
                    url: 'selective-partial-export',
                    interceptor: 'PartialExportCollection'
                };
            };

            PartialExportSelective.prototype.mapSend = function () {
                var self = this, keys = this.getKeys();
                _.map(keys, function (key) {
                    self.exportItems[key] = _.map(self.exportItems[key], function (item) {
                        return item.hasOwnProperty('vsId') ? item.vsId : item;
                    });
                });
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('PartialExportSelective', 'init', this);
        }
    })
};