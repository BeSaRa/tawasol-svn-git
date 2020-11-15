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
                                                                rootEntity,
                                                                employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'launchSequentialWorkflowPopCtrl';
        self.form = null;
        self.record = record;
        self.sequentialWorkflows = sequentialWorkflows;
        self.canAddSeqWF = rootEntity.hasPSPDFViewer() && employeeService.hasPermissionTo('ADD_SEQ_WF');

        self.selectedSeqWF = null;
        self.seqWFSearchText = '';

        self.reloadSequentialWorkflows = function () {
            return sequentialWorkflowService
                .loadSequentialWorkflowsByRegOuDocClassActive(employeeService.getEmployee().getRegistryOUID(), record.getInfo().docClassId)
                .then(function (result) {
                    return self.sequentialWorkflows = result;
                });
        };

        /**
         * @description Opens dialog for add new sequential workflow
         * @param $event
         */
        self.openAddSequentialWorkflowDialog = function ($event) {
            if (!self.canAddSeqWF) {
                return;
            }

            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowAdd(employeeService.getEmployee().getRegistryOUID(), self.record.getInfo().docClassId, $event)
                .then(function (result) {
                    self.reloadSequentialWorkflows()
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                            self.selectedSeqWF = _.find(self.sequentialWorkflows, function (item) {
                                return item.id === result.id && item.status;
                            });
                            self.onChangeSequentialWorkflow();
                        })
                })
                .catch(function () {
                    //self.reloadSequentialWorkflows(self.grid.page);
                });
        };

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
         * @param terminateAllWFS
         * @returns {boolean}
         */
        self.launchSeqWF = function ($event, terminateAllWFS) {
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
                sequentialWorkflowService.launchSeqWFCorrespondence(self.record, signatureModel, null, true, terminateAllWFS)
                    .then(function (result) {
                        if (result === 'ERROR_MULTI_USER') {
                            return dialog.confirmMessage(langService.get('workflow_in_multi_user_inbox'))
                                .then(function () {
                                    self.launchSeqWF($event, true);
                                })
                        }
                        $rootScope.$emit('SEQ_LAUNCH_SUCCESS');
                        toast.success(langService.get('launch_sequential_workflow_success'));
                        dialog.hide(true);
                    });
            }
        };

        /**
         * @description Opens dialog for add new ad-hoc sequential workflow and then send
         * @param $event
         */
        self.launchSeqWFWithEdit = function ($event) {
            if (!self.selectedSeqWF) {
                return;
            }

            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowCopy(self.selectedSeqWF, self.selectedSeqWF.regOUId, true, $event)
                .then(function (result) {
                    toast.success(langService.get('add_success').change({name: result.getNames()}));
                    self.selectedSeqWF = result;
                    self.launchSeqWF($event);
                })
                .catch(function () {

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
