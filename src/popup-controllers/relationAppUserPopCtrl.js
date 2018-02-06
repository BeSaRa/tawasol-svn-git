module.exports = function (app) {
    app.controller('relationAppUserPopCtrl', function (_,
                                                       model,
                                                       propertyToSetValue,
                                                       updateMethod,
                                                       generator,
                                                       dialog,
                                                       langService,
                                                       applicationUserService) {
        'ngInject';
        var self = this;
        self.controllerName = 'relationAppUserPopCtrl';
        self.record = angular.copy(model);

        self.selectRelationAppUsers = function ($event) {
            applicationUserService
                .controllerMethod
                .selectApplicationUsers(self.record[propertyToSetValue], "manage_sms_template_subscribers", $event)
                .then(function (applicationUsers) {
                    self.record[propertyToSetValue] = applicationUsers;
                });
        };

        /**
         * @description Add new app user
         */
        self.addRelationAppUserFromCtrl = function () {
            return updateMethod(self.record).then(function(result){
                dialog.hide(result);
            });
        };

        /**
         * @description Close the popup
         */
        self.closeRelationAppUserPopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};