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
                                                                         $templateCache,
                                                                         $templateRequest,
                                                                         $q,
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
                                                                         errorCode,
                                                                         ouApplicationUserService,
                                                                         $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserOutOfOfficeSettingPopCtrl';
        self.applicationUsers = applicationUserService.applicationUsers;
        self.ouApplicationUser = angular.copy(ouApplicationUser);
        self.model = angular.copy(ouApplicationUser);
        //self.currentEmployee = employeeService.getEmployee();
        self.applicationUser = self.model.applicationUser;
        self.authorityLevels = rootEntity.getGlobalSettings().getSecurityLevels();
        //proxy security levels for current ouApplication Users
        self.securityLevels = self.ouApplicationUser.getSecurityLevels();
        self.filteredSecurityLevels = [];
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

        self.getMaxProxyStartDate = function () {
            var endDate = self.ouApplicationUser.proxyEndDate ? new Date(self.ouApplicationUser.proxyEndDate) : null;
            self.calculatedMaxProxyStartDate = endDate ? new Date(endDate.setDate(endDate.getDate() - 1)) : null;
            return self.calculatedMaxProxyStartDate;
        };
        self.calculatedMaxProxyStartDate = self.ouApplicationUser.proxyEndDate ? self.getMaxProxyStartDate() : null;

        self.getMinProxyEndDate = function () {
            var startDate = self.ouApplicationUser.proxyStartDate ? new Date(self.ouApplicationUser.proxyStartDate) : null;
            self.calculatedMinProxyEndDate = startDate ? new Date(startDate.setDate(startDate.getDate() + 1)) : null;
            return self.calculatedMinProxyEndDate;
        };
        self.calculatedMinProxyEndDate = self.ouApplicationUser.proxyStartDate ? self.getMinProxyEndDate() : null;


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

        function _resetOutOfOfficeIfProxyUserAndAuthorityLevelsEmpty() {
            if (!self.ouApplicationUser.proxyUser && !self.ouApplicationUser.proxyAuthorityLevels) {
                self.applicationUser.outOfOffice = false;
            }
        };

        /**
         * @description to check if the current user has valid proxy or not.
         * @param ouApplicationUser
         * @private
         */
        function _checkProxyDate(ouApplicationUser) {
            if (ouApplicationUser.proxyEndDate && new Date(ouApplicationUser.proxyEndDate).valueOf() < (new Date()).valueOf()) {
                self.applicationUser.outOfOffice = false;
                self.selectedProxyUser = null;
                ouApplicationUser.emptyOutOfOffice();
                self.calculatedMaxProxyStartDate = null;
                self.calculatedMinProxyEndDate = null;
            }
        }

        _checkProxyDate(self.ouApplicationUser);
        _resetOutOfOfficeIfProxyUserAndAuthorityLevelsEmpty();

        /**
         * @description to check if the security level included for selected proxyUser.
         * @param securityLevel
         * @returns {*|boolean}
         */
        self.isSecurityLevelInclude = function (securityLevel) {
            return self.selectedProxyUser && !!(self.selectedProxyUser.securityLevels & securityLevel.lookupKey);
        };

        self.checkRequiredFieldsAppUserOutOfOffice = function (model) {
            var required = angular.copy(self.requiredFields), result = [];
            if (!self.applicationUser.outOfOffice) {
                if (!self.ouApplicationUser.proxyUser) {
                    required.splice(required.indexOf('proxyUser'), 1);
                    required.splice(required.indexOf('proxyAuthorityLevels'), 1);
                }
                if (!self.ouApplicationUser.proxyStartDate && !self.ouApplicationUser.proxyEndDate) {
                    required = _.filter(required, function (property) {
                        return property !== 'proxyStartDate' && property !== 'proxyEndDate';
                    })
                }
            }

            if (self.selectedProxyUser && !self.filteredSecurityLevels.length) {
                required = _.filter(required, function (property) {
                    return property !== 'proxyAuthorityLevels';
                });
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
                    var proxyOU = _.find(organizationService.organizations, {id: self.ouApplicationUser.proxyOUId});
                    if (self.ouApplicationUser.proxyUser) {
                        if (langService.current === 'en')
                            return self.ouApplicationUser.proxyUser.getTranslatedName() + ' - ' + proxyOU.getTranslatedName();
                        return proxyOU.getTranslatedName() + ' - ' + self.ouApplicationUser.proxyUser.getTranslatedName();
                    }
                }
                return langService.get('user_on_behalf');
            } else {
                if (langService.current === 'en')
                    return self.selectedProxyUser.applicationUser.getTranslatedName() + ' - ' + self.selectedProxyUser.organization.getTranslatedName();
                return self.selectedProxyUser.organization.getTranslatedName() + ' - ' + self.selectedProxyUser.applicationUser.getTranslatedName();
            }
        };

        //self.getSelectedDelegatedUserText();

        self.searchTextProxyUser = '';
        self.proxyUserSearch = function (searchText) {
            var results = self.availableProxies;
            if (searchText) {
                results = _.filter(self.availableProxies, function (availableProxyUSer) {
                    return availableProxyUSer.getTranslatedName().toLowerCase().indexOf(searchText.toLowerCase()) > -1;
                })
            }
            var deferred = $q.defer();
            $timeout(function () {
                deferred.resolve(results);
            }, Math.random() * 1000, false);
            return deferred.promise;
        };

        self.selectedProxyUserChange = function (proxyUser) {
            self.ouApplicationUser.proxyAuthorityLevels = null;
            self.ouApplicationUser.proxyStartDate = null;
            self.ouApplicationUser.proxyEndDate = null;
            self.filteredSecurityLevels = _.filter(self.securityLevels, self.isSecurityLevelInclude);
            if (!proxyUser) {
                self.ouApplicationUser.proxyUser = null;
            }
        };


        /**
         * @description get error message
         * @returns {string}
         */
        self.getTranslatedError = function (error) {
            var errorObj = error.data.eo;
            if (typeof errorObj === 'string') {
                return errorObj;
            }
            return langService.current === 'ar' ? errorObj.arName : errorObj.enName;
        };

        /**
         * @description Saves the ou application user data when not out of office
         */
        self.changeOutOfOffice = function () {
            if (!self.applicationUser.outOfOffice) {
                if (self.model.proxyUser) {
                    //  self.ouApplicationUser.proxyUser = null;
                    //  self.selectedProxyUser = null;
                    self.ouApplicationUser.proxyStartDate = null;
                    self.ouApplicationUser.proxyEndDate = null;
                    //  self.ouApplicationUser.proxyAuthorityLevels = null;
                    self.ouApplicationUser.viewProxyMessage = false;
                    self.ouApplicationUser.proxyMessage = null;
                }
            }
            /*if (!self.isOutOfOffice)
                self.ouApplicationUser.applicationUser.outOfOffice = false;*/
        };

        /**
         * @description Add the Application User out of office settings in the ouApplicationUser model
         */
        self.saveOutOfOfficeSettings = function () {
            self.ouApplicationUser.proxyUser = self.selectedProxyUser;

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
                    self.checkDelegatedFromAnotherUsers().then((notDelegated) => {
                        if (notDelegated) {
                            if (!self.applicationUser.outOfOffice &&
                                !self.ouApplicationUser.proxyUser && self.ouApplicationUser.proxyUser !== self.model.proxyUser) {
                                // terminate proxy user
                                ouApplicationUserService
                                    .terminateProxyUser(self.ouApplicationUser)
                                    .then(function () {
                                        toast.success(langService.get('out_of_office_success'));
                                        dialog.hide(self.ouApplicationUser);
                                    });
                            } else {
                                ouApplicationUserService
                                    .updateProxyUser(self.ouApplicationUser)
                                    .then(function (result) {
                                        toast.success(langService.get('out_of_office_success'));
                                        dialog.hide(result);
                                    });
                            }
                        }
                    });
                })
                .catch(function (error) {
                    if (errorCode.checkIf(error, 'OPERATION_NOT_SUPPORTED') === true) {
                        dialog.errorMessage(self.getTranslatedError(error));
                    }
                });

        };

        /**
         * @description Close the popup
         */
        self.closeApplicationUserOutOfOfficeSettingPopupFromCtrl = function () {
            dialog.cancel();
            // self.ouApplicationUser = self.model;
            // dialog.hide(self.ouApplicationUser);
        };
        /**
         * @description to check if the current user selected.
         * @param proxyUser
         * @returns {boolean}
         */
        self.currentUser = function (proxyUser) {
            return proxyUser.applicationUser.id === ouApplicationUser.applicationUser.id;
        };

        self.checkDelegatedFromAnotherUsers = function () {
            var defer = $q.defer();
            if (usersWhoSetYouAsProxy && usersWhoSetYouAsProxy.length) {

                var scope = $rootScope.$new(), templateDefer = $q.defer(),
                    templateUrl = cmsTemplate.getPopup('delegated-by-users-message'),
                    html = $templateCache.get(templateUrl);

                if (!html) {
                    $templateRequest(templateUrl).then(function (template) {
                        html = template;
                        templateDefer.resolve(html);
                    });
                } else {
                    $timeout(function () {
                        templateDefer.resolve(html);
                    })
                }
                templateDefer.promise.then(function (template) {
                    scope.ctrl = {
                        outOfOfficeUsers: usersWhoSetYouAsProxy
                    };
                    LangWatcher(scope);
                    template = $compile(angular.element(template))(scope);
                    $timeout(function () {
                        dialog.confirmMessage(template[0].innerHTML)
                            .then(function (result) {
                                dialog
                                    .showDialog({
                                        targetEvent: null,
                                        templateUrl: cmsTemplate.getPopup('update-manager-proxy'),
                                        controller: 'updateManagerProxyPopCtrl',
                                        controllerAs: 'ctrl',
                                        locals: {
                                            currentUser: self.ouApplicationUser,
                                            availableProxies: availableProxies
                                        },
                                        resolve: {
                                            usersWhoSetProxy: function (ouApplicationUserService) {
                                                'ngInject';
                                                return ouApplicationUserService.getUsersWhoSetYouAsProxy(self.applicationUser)
                                            }
                                        }
                                    })
                                    .then(function (result) {
                                        self.outOfOfficeSettingsForm.$setUntouched();
                                        defer.resolve(true);
                                    }).catch(function (error) {
                                    defer.reject(false);
                                    //  self.isOutOfOffice = !self.isOutOfOffice;
                                })
                            })
                            .catch(function () {
                                defer.reject(false);
                                //  self.isOutOfOffice = !self.isOutOfOffice;
                            });
                    })
                });

            } else {
                self.outOfOfficeSettingsForm.$setUntouched();
                defer.resolve(true);
            }

            return defer.promise;
        }


        self.$onInit = function () {
            self.filteredSecurityLevels = _.filter(self.securityLevels, self.isSecurityLevelInclude);

            $timeout(function () {
                self.outOfOfficeSettingsForm = $scope.outOfOfficeSettingsForm;
            })
        }
    });
};
