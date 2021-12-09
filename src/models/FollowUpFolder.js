module.exports = function (app) {
    app.factory('FollowUpFolder', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function FollowUpFolder(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.ouId = null;
            self.parent = null;
            self.userId = null;
            self.status = true;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName'
            ];

            if (model)
                angular.extend(this, model);


            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            FollowUpFolder.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Followup Folder. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            FollowUpFolder.prototype.getNames = function (separator) {
                if (this.arName && this.enName)
                    return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
                else if (this.arName && !this.enName)
                    return this.arName;
                else if (!this.arName && this.enName)
                    return this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Followup Folder. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            FollowUpFolder.prototype.getTranslatedName = function (reverse) {
                var name = '';
                if (langService.current === 'ar') {
                    if (reverse)
                        name = this.enName ? this.enName : this.arName;
                    else
                        name = this.arName ? this.arName : this.enName;
                } else if (langService.current === 'en') {
                    if (reverse)
                        name = this.arName ? this.arName : this.enName;
                    else
                        name = this.enName ? this.enName : this.arName;
                }
                return name;
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            FollowUpFolder.prototype.getNameByLanguage = function (language) {
                var name = this[language + 'Name'];
                if (name) {
                    return name;
                }
                // if name doesn't exist for language passed, return the name by other language
                return this[language === 'ar' ? 'enName' : 'arName'];
            };

            /**
             * @description Get the status of Followup Folder as Active or Inactive instead of true or false.
             * @returns {string}
             */
            FollowUpFolder.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            FollowUpFolder.prototype.hasParent = function () {
                return !!this.parent;
            };

            FollowUpFolder.prototype.setChildren = function (folders) {
                this.children = folders;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FollowUpFolder', 'init', this);
        }
    })
};
