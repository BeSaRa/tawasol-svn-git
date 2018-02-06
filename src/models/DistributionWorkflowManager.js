module.exports = function (app) {
    app.factory('DistributionWorkflowManager', function (CMSModelInterceptor,
                                                         langService,
                                                         _) {
        'ngInject';
        return function DistributionWorkflowManager(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.parent = null;
            self.domainName = null;
            self.ouId = null;
            self.relationId = null;
            self.proxyInfo = null;

            self.smsNotification = false;
            self.emailNotification = false;
            self.action = null;
            self.dueDate = null;
            self.escalationProcess = null;
            self.selected = false;

            self.toUserDomain = null;
            self.appUserOUID = null;

            self.workflowUserType = "AllManager";

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            DistributionWorkflowManager.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Distribution Workflow Manager. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            DistributionWorkflowManager.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Distribution Workflow Manager. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            DistributionWorkflowManager.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the translated arabic or english OU name according to current language for Distribution Workflow Application User. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            DistributionWorkflowManager.prototype.getTranslatedOUName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.ouEnName : this.ouArName ) : (reverse ? this.ouArName : this.ouEnName);
            };

            /**
             * @description Get the status of Distribution Workflow Manager as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DistributionWorkflowManager.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * select/Unselect the heading for favorite managers
             * @returns {DistributionWorkflowManager}
             * @param isFavoriteManagerExist
             */
            DistributionWorkflowManager.prototype.setSelected = function (isFavoriteManagerExist) {
                this.selected = !!isFavoriteManagerExist;
                return this;
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionWorkflowManager', 'init', this);
        }
    })
};