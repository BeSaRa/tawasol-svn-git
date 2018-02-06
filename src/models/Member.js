module.exports = function (app) {
    app.factory('Member', function (CMSModelInterceptor,
                                    langService) {
        'ngInject';
        return function Member(model) {
            var self = this;
            self.employeeNo = null;
            self.loginName = null;
            self.arFullName = null;
            self.enFullName = null;
            self.organization = null;
            self.status = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Member.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description Get the status of Member as active  or inactive instead of true or false.
             * @returns {string}
             */
            Member.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Member', 'init', this);
        }
    })
};