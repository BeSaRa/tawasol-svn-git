module.exports = function (app) {
    app.controller('applicationUserOutOfOfficeSettingPopCtrl', function (dialog,
                                                                         _,
                                                                         ouApplicationUser,
                                                                         applicationUserService,
                                                                         lookupService,
                                                                         employeeService,
                                                                         validationService,
                                                                         generator,
                                                                         availableProxies,
                                                                         toast,
                                                                         $rootScope,
                                                                         cmsTemplate,
                                                                         LangWatcher,
                                                                         langService,
                                                                         ProxyUser,
                                                                         rootEntity,
                                                                         $timeout,
                                                                         $compile,
                                                                         usersWhoSetYouAsProxy,
                                                                         organizationService,
                                                                         ouApplicationUserService) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserOutOfOfficeSettingPopCtrl';
        self.applicationUsers = applicationUserService.applicationUsers;
        self.ouApplicationUser = angular.copy(ouApplicationUser);
        self.model = angular.copy(ouApplicationUser);
        //self.currentEmployee = employeeService.getEmployee();
        self.applicationUser = self.model.applicationUser;
        //self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.authorityLevels = rootEntity.getGlobalSettings().getSecurityLevels();
        self.availableProxies = availableProxies;
        self.selectedProxyUser = ouApplicationUser.getSelectedProxyId() ? _.find(availableProxies, function (item) {
            return item.id === ouApplicationUser.getSelectedProxyId();
        }) : null;
        var currentDate = new Date();
        self.today = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate()
        );
        // tomorrow
        self.tomorrow = (new Date()).setDate(self.today.getDate() + 1);
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
         * @description to check if the current user has valid proxy or not.
         * @param ouApplicationUser
         * @private
         */
        function _checkProxyDate(ouApplicationUser) {
            if (ouApplicationUser.proxyEndDate && ouApplicationUser.proxyEndDate.valueOf() < (new Date()).valueOf()) {
                self.isOutOfOffice = false;
                self.applicationUser.outOfOffice = false;
                self.selectedProxyUser = null;
                ouApplicationUser.emptyOutOfOffice();
            }
        }

        _checkProxyDate(self.ouApplicationUser);

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
            if (!self.applicationUser.outOfOffice) {
                if (!self.ouApplicationUser.proxyStartDate && !self.ouApplicationUser.proxyEndDate) {
                    required = _.filter(required, function (property) {
                        return property !== 'proxyStartDate' && property !== 'proxyEndDate';
                    })
                }
            }
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

        self.getSelectedDelegatedUserText = function () {
            if (!self.selectedProxyUser) {
                if (self.ouApplicationUser.applicationUser.outOfOffice) {
                    var proxyOU = _.find(organizationService.organizations, {id : self.ouApplicationUser.proxyOUId});
                    if(self.ouApplicationUser.proxyUser) {
                        if (langService.current === 'en')
                            return self.ouApplicationUser.proxyUser.getTranslatedName() + ' - ' + proxyOU.getTranslatedName();
                        return proxyOU.getTranslatedName() + ' - ' + self.ouApplicationUser.proxyUser.getTranslatedName();
                    }
                }
                return langService.get('user_on_behalf');
            }
            else {
                if (langService.current === 'en')
                    return self.selectedProxyUser.applicationUser.getTranslatedName() + ' - ' + self.selectedProxyUser.organization.getTranslatedName();
                return self.selectedProxyUser.organization.getTranslatedName() + ' - ' + self.selectedProxyUser.applicationUser.getTranslatedName();
            }
        };

        //self.getSelectedDelegatedUserText();

        /**
         * @description Saves the ou application user data when not out of office
         * @param form
         */
        self.changeOutOfOffice = function (form) {
            if (!self.isOutOfOffice) {
                if(self.model.proxyUser) {
                    self.ouApplicationUser.proxyUser = self.selectedProxyUser = null;
                    self.ouApplicationUser.proxyStartDate = null;
                    self.ouApplicationUser.proxyEndDate = null;
                    self.ouApplicationUser.proxyAuthorityLevels = null;
                    self.ouApplicationUser.viewProxyMessage = false;
                    self.ouApplicationUser.proxyMessage = null;
                }
            } else {
                if (usersWhoSetYouAsProxy && usersWhoSetYouAsProxy.length) {
                    var scope = $rootScope.$new();

                    var html = cmsTemplate.getPopup('delegated-by-users-message');
                    scope.ctrl = {
                        outOfOfficeUsers: usersWhoSetYouAsProxy
                    };
                    LangWatcher(scope);
                    html = $compile(angular.element(html))(scope);

                    $timeout(function () {
                        dialog.confirmMessage(html[0].innerHTML)
                            .then(function (result) {
                                form.$setUntouched();
                            })
                            .catch(function () {
                                self.isOutOfOffice = !self.isOutOfOffice;
                            });
                    });

                }
                else
                    form.$setUntouched();
            }
            if (!self.isOutOfOffice)
                self.ouApplicationUser.applicationUser.outOfOffice = false;
        };

        /**
         * @description Add the Application User out of office settings in the ouApplicationUser model
         */
        self.addApplicationUserOutOfOfficeSettingsFromCtrl = function () {
            if (self.selectedProxyUser) {
                self.ouApplicationUser.proxyUser = self.selectedProxyUser;
            }
            if (!self.isOutOfOffice) {
                dialog.hide(self.ouApplicationUser);
            } else {
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
                        self.ouApplicationUser.applicationUser = self.applicationUser;
                        dialog.hide(self.ouApplicationUser);
                    })
                    .catch(function () {

                    });
            }
        };

        /**
         * @description Close the popup
         */
        self.closeApplicationUserOutOfOfficeSettingPopupFromCtrl = function () {
            self.ouApplicationUser = self.model;
            dialog.hide(self.ouApplicationUser);
        };
        /**
         * @description to check if the current user selected.
         * @param proxyUser
         * @returns {boolean}
         */
        self.currentUser = function (proxyUser) {
            return proxyUser.applicationUser.id === ouApplicationUser.applicationUser.id;
        }
    });
};