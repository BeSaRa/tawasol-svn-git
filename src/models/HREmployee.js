module.exports = function (app) {
    app.factory('HREmployee', function (CMSModelInterceptor) {

        'ngInject';
        return function HREmployee(model) {
            var self = this;
            self.qId = null;
            self.arName = null;
            self.enName =  null;
            self.joiningDate = null;
            self.lastWorkingDate = null;
            self.status = false;
            self.gender = null;
            self.mobile=  null;
            self.email= null;
            self.employeeNo = null;
            self.domainName = null;
            self.nationality = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            CMSModelInterceptor.runEvent('HREmployee', 'init', this);

        }
    });
};
