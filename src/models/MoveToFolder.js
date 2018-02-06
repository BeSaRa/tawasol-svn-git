module.exports = function (app) {
    app.factory('MoveToFolder', function (CMSModelInterceptor,
                                          langService,
                                          _) {
        'ngInject';
        return function MoveToFolder(model) {
            var self = this;
            self.id = null;
            self.userID = null;
            self.ouID = null;
            self.parent = null;
            self.arName = null;
            self.enName = null;
            self.itemOrder = null;
            self.status = false;
            // self.isWorkItem = false;
            self.workItems = [];
            self.children = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            MoveToFolder.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for move to folder record. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            MoveToFolder.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for move to folder record. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            MoveToFolder.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of move to folder record as Active or Inactive instead of true or false.
             * @returns {string}
             */
            MoveToFolder.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('MoveToFolder', 'init', this);
        }
    })
};