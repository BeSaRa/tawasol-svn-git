module.exports = function (app) {
    app.controller('sequentialWorkflowStepPopCtrl', function ($timeout,
                                                              dialog,
                                                              generator,
                                                              $scope,
                                                              distributionWFService) {
        'ngInject';
        var self = this,
            readonlyFields = ['itemOrder'];

        self.controllerName = 'sequentialWorkflowStepPopCtrl';

        self.form = null;
        self.ouSearchText = '';
        self.appUserSearchText = '';
        self.actionSearchText = '';
        self.applicationUsers = [];

        self.isValidForm = function (form, setTouched) {
            form = form || self.form;
            if (!form) {
                return true;
            }
            generator.validateRequiredSelectFields(form, setTouched);
            return form.$valid && self.step.isValidStep(self.record);
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
            dialog.hide(self.step);
        };


        self.resetModel = function (form) {
            generator.resetFields(self.step, self.stepCopy);

            form = form || self.form;
            if (form) {
                form.$setUntouched();
            }
        };

        /**
         * @description Get the Application Users for the selected Organization
         */
        self.getAppUsersForOU = function (skipResetUser, $event) {
            if (!skipResetUser) {
                self.step.toUserId = null;
            }
            if (!self.step.toOUID) {
                self.applicationUsers = [];
                return;
            }
            return distributionWFService
                .searchUsersByCriteria({ou: self.step.toOUID})
                .then(function (result) {
                    self.applicationUsers = result;
                    return result;
                });
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
                self.recordCopy = angular.copy(self.record);
                self.stepCopy = angular.copy(self.step);

                self.isUserRequired = self.step.checkUserRequired(self.record);

                if (self.stepCopy.toOUID) {
                    self.getAppUsersForOU(true, null);
                }
            });
        };

    });
};
