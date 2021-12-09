module.exports = function (app) {
    app.factory('SendDistributionWorkflow', function (CMSModelInterceptor,
                                                      langService,
                                                      _) {
        'ngInject';
        return function SendDistributionWorkflow(model) {
            var self = this;
            self.normalUsers = [];
            self.managerUsers = [];
            self.favouriteUsers = [];
            self.receivedOUs = [];
            self.wfGroups = [];
            self.receivedRegOUs = [];
            self.userWfGroups = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            SendDistributionWorkflow.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for Send Distribution Workflow. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            SendDistributionWorkflow.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for Send Distribution Workflow. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            SendDistributionWorkflow.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of Send Distribution Workflow as Active or Inactive instead of true or false.
             * @returns {string}
             */
            SendDistributionWorkflow.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /*/!**
             * @description Get the globalization of Send Distribution Workflow as Yes or No instead of true or false.
             * @returns {string}
             *!/
             SendDistributionWorkflow.prototype.getTranslatedGlobal = function () {
             return this.global ? langService.get('yes') : langService.get('no');
             };*/

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SendDistributionWorkflow', 'init', this);
        }
    })
};