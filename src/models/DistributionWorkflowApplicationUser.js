module.exports = function (app) {
    app.factory('DistributionWorkflowApplicationUser', function (CMSModelInterceptor,
                                                                 langService,
                                                                 _) {
        'ngInject';
        return function DistributionWorkflowApplicationUser(model) {
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
            self.proxyInfo = null;

            self.smsNotification = false;
            self.emailNotification = false;
            self.action = null;
            self.dueDate = null;
            self.escalationProcess = null;
            self.selected = false;

            self.toUserDomain = null;
            self.appUserOUID = null;

            self.workflowUserType = "AllApplicationUser";

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            DistributionWorkflowApplicationUser.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Distribution Workflow Application User. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            DistributionWorkflowApplicationUser.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Distribution Workflow Application User. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            DistributionWorkflowApplicationUser.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the translated arabic or english OU name according to current language for Distribution Workflow Application User. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            DistributionWorkflowApplicationUser.prototype.getTranslatedOUName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.ouEnName : this.ouArName ) : (reverse ? this.ouArName : this.ouEnName);
            };

            /**
             * @description Get the status of Distribution Workflow Application User as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DistributionWorkflowApplicationUser.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * select/Unselect the heading for favorite users
             * @param isFavoriteUserExist
             * @returns {DistributionWorkflowApplicationUser}
             */
            DistributionWorkflowApplicationUser.prototype.setSelected = function (isFavoriteUserExist) {
                this.selected = !!isFavoriteUserExist;
                return this;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionWorkflowApplicationUser', 'init', this);
        }
    })
};