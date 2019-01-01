module.exports = function (app) {
    app.factory('UserFolder', function (CMSModelInterceptor,
                                        langService,
                                        _) {
        'ngInject';
        return function UserFolder(model) {
            var self = this;
            self.id = null;
            self.userID = null;
            self.ouID = null;
            self.parent = null;
            self.arName = null;
            self.enName = null;
            self.itemOrder = null;
            self.status = true;
            self.children = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName', 'enName'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            UserFolder.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for User Folder. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            UserFolder.prototype.getNames = function (separator) {
                if (this.arName && this.enName)
                    return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
                else if (this.arName && !this.enName)
                    return this.arName;
                else if (!this.arName && this.enName)
                    return this.enName;
                //return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for User Folder. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            UserFolder.prototype.getTranslatedName = function (reverse) {
                var name = '';
                if (langService.current === 'ar') {
                    if (reverse)
                        name = this.enName ? this.enName : this.arName;
                    else
                        name = this.arName ? this.arName : this.enName;
                }
                else if (langService.current === 'en') {
                    if (reverse)
                        name = this.arName ? this.arName : this.enName;
                    else
                        name = this.enName ? this.enName : this.arName;
                }
                return name;

                //return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of User Folder as Active or Inactive instead of true or false.
             * @returns {string}
             */
            UserFolder.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /*/!**
             * @description Get the globalization of User Folder as Yes or No instead of true or false.
             * @returns {string}
             *!/
             UserFolder.prototype.getTranslatedGlobal = function () {
             return this.global ? langService.get('yes') : langService.get('no');
             };*/

            UserFolder.prototype.hasParent = function () {
                return !!this.parent;
            };

            UserFolder.prototype.setChildren = function (folders) {
                this.children = folders;
                return this;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserFolder', 'init', this);
        }
    })
};