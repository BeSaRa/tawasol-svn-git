module.exports = function (app) {
    app.factory('WorkflowGroupDistributionWorkflow', function (CMSModelInterceptor,
                                                               langService,
                                                               _) {
        'ngInject';
        return function WorkflowGroupDistributionWorkflow(model) {
            var self = this;
            self.id = null;
            self.applicationUser = {};
            self.wfgroup = {};


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            WorkflowGroupDistributionWorkflow.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for WorkflowGroup DistributionWorkflow. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            WorkflowGroupDistributionWorkflow.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for WorkflowGroup DistributionWorkflow. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            WorkflowGroupDistributionWorkflow.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of WorkflowGroup DistributionWorkflow as Active or Inactive instead of true or false.
             * @returns {string}
             */
            WorkflowGroupDistributionWorkflow.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /*/!**
             * @description Get the globalization of WorkflowGroup DistributionWorkflow as Yes or No instead of true or false.
             * @returns {string}
             *!/
             WorkflowGroupDistributionWorkflow.prototype.getTranslatedGlobal = function () {
             return this.global ? langService.get('yes') : langService.get('no');
             };*/

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkflowGroupDistributionWorkflow', 'init', this);
        }
    })
};