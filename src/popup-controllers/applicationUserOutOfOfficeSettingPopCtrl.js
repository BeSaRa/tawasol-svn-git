module.exports = function (app) {
    app.controller('applicationUserOutOfOfficeSettingPopCtrl', function (dialog,
                                                                         ouApplicationUser,
                                                                         applicationUserService,
                                                                         lookupService,
                                                                         employeeService,
                                                                         validationService,
                                                                         generator,
                                                                         toast,
                                                                         langService,
                                                                         ouApplicationUserService) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserOutOfOfficeSettingPopCtrl';
        self.applicationUsers = applicationUserService.applicationUsers;
        self.ouApplicationUser = angular.copy(ouApplicationUser);
        self.model = angular.copy(ouApplicationUser);
        self.currentEmployee = employeeService.getEmployee();
        self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        var currentDate = new Date();
        self.today = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate()
        );

        self.requiredFields = [
            'proxyUser',
            'proxyAuthorityLevels',
            'proxyStartDate',
            'proxyEndDate',
            'viewProxyMessage'//,
            //'proxyMessage'
        ];
        self.validateLabels = {
            proxyUser: 'user_on_behalf',
            proxyAuthorityLevels: 'authority_level',
            proxyStartDate: 'start_date',
            proxyEndDate: 'end_date',
            viewProxyMessage: 'view_message_to_sender'//,
            //proxyMessage: 'out_of_office_message'
        };


        /**
         * @description Describes if user is out of office
         * @type {boolean}
         */
        self.isOutOfOffice = self.ouApplicationUser.proxyUser != null;

        /**
         * @description Returns out of office value as Yes/No instead of true/false
         * @returns {*}
         */
        self.getTranslatedOutOfOfficeYesNo = function () {
            return self.isOutOfOffice ? langService.get('yes') : langService.get('no');
        };

        self.checkRequiredFieldsAppUserOutOfOffice = function (model) {
            var required = self.requiredFields, result = [];
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        self.checkRequiredOutOfOfficeMessage = function (model) {
            var property = 'proxyMessage', result = [];
            if (model.viewProxyMessage && !generator.validRequired(model[property]))
                result.push(property);
            return result;
        };

        /**
         * @description Saves the ou application user data when not out of office
         * @param form
         */
        self.changeOutOfOffice = function (form) {
            if (!self.isOutOfOffice && self.model.proxyUser) {
                self.ouApplicationUser.proxyUser = null;
                self.ouApplicationUser.proxyStartDate = null;
                self.ouApplicationUser.proxyEndDate = null;
                self.ouApplicationUser.proxyAuthorityLevels = null;
                self.ouApplicationUser.viewProxyMessage = false;
                self.ouApplicationUser.proxyMessage = null;
                ouApplicationUserService
                    .updateOUApplicationUser(self.ouApplicationUser)
                    .then(function (result) {
                        employeeService.setCurrentOUApplicationUser(result);
                        self.model = angular.copy(result);
                        toast.success(langService.get('out_of_office_success'));
                    });
            }
            else {
                form.$setUntouched();
            }
        };

        /**
         * @description Add the Application User out of office settings in the ouApplicationUser model
         */
        self.addApplicationUserOutOfOfficeSettingsFromCtrl = function () {
            validationService
                .createValidation('ADD_OUT_OF_OFFICE_SETTINGS')
                .addStep('check_required', true, self.checkRequiredFieldsAppUserOutOfOffice, self.ouApplicationUser, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_message_required', true, self.checkRequiredOutOfOfficeMessage, self.ouApplicationUser, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = ['out_of_office_message'];
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    dialog.hide(self.ouApplicationUser);
                })
                .catch(function () {

                });
        };

        /**
         * @description Close the popup
         */
        self.closeApplicationUserOutOfOfficeSettingPopupFromCtrl = function () {
            self.ouApplicationUser = self.model;
            dialog.cancel(self.ouApplicationUser);
        }
    });
};