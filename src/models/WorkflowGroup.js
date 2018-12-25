module.exports = function (app) {
    app.factory('WorkflowGroup', function (CMSModelInterceptor,
                                           langService,
                                           _,
                                           ApplicationUser) {
        'ngInject';
        return function WorkflowGroup(model) {
            var self = this;

            //region Workflow Group properties
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.global = true;
            self.groupMembers = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'groupMembers'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            WorkflowGroup.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            WorkflowGroup.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            WorkflowGroup.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            WorkflowGroup.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };
            WorkflowGroup.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            WorkflowGroup.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            WorkflowGroup.prototype.getTranslatedGlobal = function () {
                return this.global ? langService.get('yes') : langService.get('no');
            };
            WorkflowGroup.prototype.getFirstMember = function () {
                return this.groupMembers.length ? this.groupMembers[0].applicationUser : new ApplicationUser();
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkflowGroup', 'init', this);
        }
    })
};