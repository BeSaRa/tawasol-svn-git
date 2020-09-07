module.exports = function (app) {
    app.controller('launchSequentialWorkflowPopCtrl', function (_,
                                                                toast,
                                                                $rootScope,
                                                                generator,
                                                                dialog,
                                                                $scope,
                                                                AnnotationType,
                                                                $timeout,
                                                                langService,
                                                                record,
                                                                sequentialWorkflows,
                                                                sequentialWorkflowService,
                                                                attachmentService) {
        'ngInject';
        var self = this;
        self.controllerName = 'launchSequentialWorkflowPopCtrl';
        self.form = null;
        self.record = record;
        self.sequentialWorkflows = sequentialWorkflows;

        self.selectedSeqWF = null;
        self.seqWFSearchText = '';

        /**
         * @description Handles the change of sequential workflow
         * @param $event
         */
        self.onChangeSequentialWorkflow = function ($event) {
            self.redrawSteps = true;
            $timeout(function () {
                self.redrawSteps = false;
            }, 100);
        };

        /**
         * @description checks if form is valid
         * @param form
         * @returns {boolean}
         */
        self.isValidForm = function (form) {
            form = form || self.form;
            if (!form) {
                return true;
            }
            generator.validateRequiredSelectFields(form);
            return form.$valid;
        };

        /**
         * @description Launches the sequential workflow
         * @param $event
         * @returns {boolean}
         */
        self.launchSeqWF = function ($event) {
            if (!self.isValidForm()) {
                return false;
            }

            if (self.selectedSeqWF.steps[0].isAuthorizeAndSendStep()) {
                self.record.openSequentialDocument(AnnotationType.SIGNATURE, self.selectedSeqWF)
                    .then(function () {
                        $rootScope.$emit('SEQ_LAUNCH_SUCCESS');
                        dialog.hide();
                    })
                    .catch(function (error) {
                        console.log('ERROR  FORM LAUNCH', error);
                    });
            } else {
                // cause no need any of those properties is case it is just send (pinCode , composite , ignoreMultiSignValidation)
                var signatureModel = self.record.prepareSignatureModel(null, null, null);
                signatureModel.setSeqWFId(self.selectedSeqWF.id);
                console.log('signatureModel FORM Launch SEQ', signatureModel);
                sequentialWorkflowService.launchSeqWFCorrespondence(self.record, signatureModel, null, true)
                    .then(function (result) {
                        $rootScope.$emit('SEQ_LAUNCH_SUCCESS');
                        toast.success(langService.get('launch_success_distribution_workflow'));
                        dialog.hide(true);
                    });
            }
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

        self.$onInit = function () {
            $timeout(function () {
                self.form = $scope.launchSequentialWFForm;
            })
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };
    });
};
