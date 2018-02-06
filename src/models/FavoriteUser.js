module.exports = function (app) {
    app.factory('FavoriteUser', function (CMSModelInterceptor,
                                            langService,
                                            _) {
        'ngInject';
        return function FavoriteUser(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.parent = null;
            self.domainName = null;
            self.ouArName = null;
            self.ouEnName = null;
            self.ouId = null;
            self.relationId = null;
            self.parentId = null;
            self.selected = true;

            self.toUserDomain = null;
            self.appUserOUID = null;

            self.workflowUserType = "AllFavoriteUser";

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            FavoriteUser.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Favorite User. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            FavoriteUser.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Favorite User. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            FavoriteUser.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of Favorite User as Active or Inactive instead of true or false.
             * @returns {string}
             */
            FavoriteUser.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FavoriteUser', 'init', this);
        }
    })
};