module.exports = function (app) {
    app.factory('AdminResultRelation', function (CMSModelInterceptor,
                                                 langService,
                                                 Information) {
        'ngInject';
        return function AdminResultRelation(model) {
            var self = this;
            Information.call(this);
            self.relationId = null;
            self.hasRegistry = false;
            self.sendEmail = false;
            self.sendSMS = false;
            self.regouId = null;
            self.isPrivateRegistry = false;
            self.sla = null;
            self.securityLevels = null;
            self.status = false;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('AdminResultRelation', 'init', this);
        }
    })
};
