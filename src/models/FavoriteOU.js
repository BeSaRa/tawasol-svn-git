module.exports = function (app) {
    app.factory('FavoriteOU', function (CMSModelInterceptor,
                                        langService,
                                        _) {
        'ngInject';
        return function FavoriteOU(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.parent = null;
            self.relationId = null;
            self.selected = true;

            self.ouArName = null;
            self.ouEnName = null;

            self.workflowUserType = "FavoriteOU";

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            FavoriteOU.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Favorite OU. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            FavoriteOU.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Favorite OU. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            FavoriteOU.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of Favorite OU as Active or Inactive instead of true or false.
             * @returns {string}
             */
            FavoriteOU.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /*/!**
             * @description Get the globalization of Favorite OU as Yes or No instead of true or false.
             * @returns {string}
             *!/
             FavoriteOU.prototype.getTranslatedGlobal = function () {
             return this.global ? langService.get('yes') : langService.get('no');
             };*/

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FavoriteOU', 'init', this);
        }
    })
};