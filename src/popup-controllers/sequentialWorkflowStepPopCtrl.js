module.exports = function (app) {
    app.controller('sequentialWorkflowStepPopCtrl', function ($timeout,
                                                              dialog,
                                                              generator,
                                                              $scope,
                                                              _,
                                                              Information,
                                                              ouApplicationUserService) {
        'ngInject';
        var self = this,
            readonlyFields = ['itemOrder'];

        self.controllerName = 'sequentialWorkflowStepPopCtrl';

        self.form = null;
        self.ouSearchText = '';
        self.appUserSearchText = '';
        self.actionSearchText = '';
        self.commentSearchText = '';
        self.comment = null;

        self.isValidForm = function (form, setTouched) {
            form = form || self.form;
            if (!form) {
                return true;
            }
            generator.validateRequiredSelectFields(form, setTouched);
            return form.$valid && self.step.isValidStep(self.seqWF);
        };

        /**
         * @description Sets the original value for readonly fields
         * @private
         */
        function _resetReadonlyFields() {
            for (var i = 0; i < readonlyFields.length; i++) {
                self.step[readonlyFields[i]] = angular.copy(self.stepCopy[readonlyFields[i]]);
            }
        }

        function _resetUserData() {
            self.step.actionId = null;
            self.step.sendSMS = false;
            self.step.sendEmail = false;
            self.comment = null;
            self.step.userComment = null;
        }

        function _updateOuAndUserInfo() {
            var ouAppUser = _.find(self.ouApplicationUsers, function (item) {
                    return item.userIdAndOuId === self.step.userIdAndOuId;
                }),
                selectedOu = _.find(self.organizations, function (item) {
                    return item.id === Number(self.step.uiOuId);
                });

            if (selectedOu && ouAppUser.getApplicationUser()) {
                self.step.toUserInfo = new Information({
                    arName: ouAppUser.getApplicationUser().getNameByLanguage('ar'),
                    enName: ouAppUser.getApplicationUser().getNameByLanguage('en'),
                    id: Number(self.step.getUserIdFromCombination())
                });

                self.step.toOUInfo = new Information({
                    arName: selectedOu.getNameByLanguage('ar'), // + ' - ' + ouAppUser.getOrganization().getNameByLanguage('ar'),
                    enName: selectedOu.getNameByLanguage('en')// + ' - ' + ouAppUser.getOrganization().getNameByLanguage('en')
                });
            } else {
                self.step.toUserInfo = null;
                self.step.toOUInfo = null;
            }
        }

        /**
         * @description Set the step values and close dialog
         * @param $event
         */
        self.setStep = function ($event) {
            if (self.viewOnly) {
                dialog.hide(self.stepCopy);
                return;
            }

            if (!self.isValidForm()) {
                return;
            }
            _resetReadonlyFields();
            if (!self.step.userIdAndOuId) {
                _resetUserData();
            }
            _updateOuAndUserInfo();
            dialog.hide(self.step);
        };

        self.resetModel = function (form) {
            generator.resetFields(self.step, self.stepCopy);

            form = form || self.form;
            if (form) {
                form.$setUntouched();
            }
        };

        function _setUserIdAndOUIdCombination(ouApplicationUsers) {
            return _.map(ouApplicationUsers, function (item) {
                item.userIdAndOuId = item.getUserIdAndOuIdCombination();
                return item;
            });
        }

        /**
         * @description Get the Application Users for the selected Organization
         */
        self.getAppUsersForOU = function (skipResetUser, $event) {
            self.ouApplicationUsers = [];

            if (!skipResetUser) {
                self.step.userIdAndOuId = null;
                _resetUserData();
            }
            if (!self.step.uiOuId) {
                self.step.userIdAndOuId = null;
                _resetUserData();
                return;
            }
            return ouApplicationUserService
                .searchByCriteria({regOu: generator.getNormalizedValue(self.step.uiOuId, 'id')})
                .then(function (result) {
                    self.ouApplicationUsers = _setUserIdAndOUIdCombination(result);
                    return result;
                });
        };

        self.onChangeUser = function () {
            if (!self.step.userIdAndOuId) {
                _resetUserData();
            } else {
                var user = _.find(self.ouApplicationUsers, function (item) {
                    return item.userIdAndOuId === self.step.userIdAndOuId;
                });
                self.step.sendSMS = user.getApplicationUser().subscriptionsmsNotify;
                self.step.sendEmail = user.getApplicationUser().subscriptionEmailNotify;
            }
        };

        /**
         * @description when selected comment changed.
         */
        self.onCommentChange = function () {
            self.step.userComment = self.comment.getComment();
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function ($event) {
            dialog.cancel();
        };

        self.$onInit = function () {
            $timeout(function () {
                self.form = $scope.sequentialWorkflowStepForm || null;
                /*// if internal seqWF, disable organization as wf will be inside organization only
                if (self.seqWF.isInternalSeqWF()) {
                    readonlyFields.push('uiOuId');
                }*/
                self.stepCopy = angular.copy(self.step);
                self.isUserRequired = self.step.checkUserRequired(self.seqWF);
            });
        };

    });
};
