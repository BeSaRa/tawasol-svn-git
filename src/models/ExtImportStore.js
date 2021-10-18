module.exports = function (app) {
    app.factory('ExtImportStore', function (CMSModelInterceptor,
                                                langService) {
        'ngInject';
        return function ExtImportStore(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.creatorId = null; // readonly property
            self.creatorOUId = null; // readonly property
            self.dataSource = null; // transient property
            self.dataSourceJndi = null;
            self.sourceName = null;
            self.sourceIdentifier = null;
            self.searchColumn = null;
            self.contentColumn = null;
            self.contentTypeColumn = null;
            self.metaDataColumns = []; //json string of metadata fields
            self.metaDataColumnList = null; // transient property


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'status',
                'dataSourceJndi',
                'sourceName',
                'sourceIdentifier',
                'searchColumn',
                'contentColumn',
                'contentTypeColumn',
                'metaDataColumns',
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            ExtImportStore.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for external data source. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            ExtImportStore.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for external data source. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            ExtImportStore.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of external data source as Active or Inactive instead of true or false.
             * @returns {string}
             */
            ExtImportStore.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ExtImportStore', 'init', this);
        }
    })
};
