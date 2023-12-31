module.exports = function (app) {
    app.controller('sequentialWorkflowPopCtrl', function (_,
                                                          toast,
                                                          generator,
                                                          dialog,
                                                          $scope,
                                                          $timeout,
                                                          lookupService,
                                                          langService,
                                                          editMode,
                                                          viewOnly,
                                                          employeeService,
                                                          defaultDocClass,
                                                          sequentialWorkflow,
                                                          allowChangeOu,
                                                          organizations,
                                                          sequentialWorkflowService) {
            'ngInject';
            var self = this,
                documentClassMap = {
                    outgoing: 0,
                    incoming: 1,
                    internal: 2
                },
                minimumStepsCount = 2;
            self.controllerName = 'sequentialWorkflowPopCtrl';
            self.stepsUsageType = sequentialWorkflowService.stepsUsageTypes.manageWFSteps;

            self.form = null;
            self.editMode = editMode;
            self.viewOnly = viewOnly;
            self.redrawSteps = false;
            self.sequentialWorkflow = sequentialWorkflow;
            self.model = angular.copy(self.sequentialWorkflow);
            self.selectedDocClass = self.model.docClassID;
            self.allowChangeOu = allowChangeOu;
            self.organizations = organizations;

            self.defaultDocClass = defaultDocClass;
            self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
            self.ouSearchText = '';

            /**
             * @description Checks if form is valid
             * @param form
             * @returns {boolean}
             */
            self.isValidForm = function (form) {
                form = form || self.form;
                if (!form) {
                    return true;
                }
                generator.validateRequiredSelectFields(form);
                if (self.sequentialWorkflow.isSubWorkflow) {
                    return form.$valid && _isValidSteps();
                }
                return form.$valid && _isValidSteps() && _hasOneAuthorizeAndSend();
            };

            function _hasOneAuthorizeAndSend() {
                if (!_hasStepRows()) {
                    return false;
                }
                if (self.sequentialWorkflow.isIncomingSeqWF()) {
                    return true;
                } else {
                    return !!_.find(self.sequentialWorkflow.stepRows, function (stepRow) {
                        if (!stepRow) {
                            return false;
                        }
                        return stepRow.isAuthorizeAndSendStep();
                    })
                }
            }

            function _hasStepRows() {
                return self.sequentialWorkflow.stepRows && self.sequentialWorkflow.stepRows.length;
            }

            function _isValidSteps() {
                if (!_hasStepRows()) {
                    return false;
                }
                return _.every(self.sequentialWorkflow.stepRows, function (stepRow) {
                    if (!stepRow) {
                        return false;
                    }
                    return stepRow.isValidStep(self.sequentialWorkflow);
                })
            }

            /**
             * @description Checks if value exists
             * @param value
             * @returns {boolean|boolean}
             * @private
             */

            self.hasValue = function (value) {
                return typeof value !== 'undefined' && value !== null && value !== '';
            };

            /**
             * @description Sets the doc type as incoming and clear steps
             * @private
             */
            function _setIncomingDocType() {
                self.sequentialWorkflow.docClassID = angular.copy(self.selectedDocClass);
                self.sequentialWorkflow.steps = [];
                self.sequentialWorkflow.stepRows = [];
                _setRedrawSteps();
            }

            /**
             * @description Handles the change of document type to manage steps
             * @param ignoreReset
             */
            self.handleDocTypeChange = function (ignoreReset) {
                if (self.viewOnly || self.model.id) {
                    self.selectedDocClass = angular.copy(self.sequentialWorkflow.docClassID);
                    return;
                }
                // if there is no selected value or there is selected value and new value is not incoming,set the selected class to seqWF
                // otherwise, confirm remove steps
                if (!self.hasValue(self.sequentialWorkflow.docClassID) || !_isIncomingSeqWF(self.selectedDocClass)) {
                    self.sequentialWorkflow.docClassID = angular.copy(self.selectedDocClass);
                } else {
                    if (ignoreReset) {
                        self.sequentialWorkflow.docClassID = angular.copy(self.selectedDocClass);
                        _setRedrawSteps();
                        return;
                    }
                    dialog.confirmMessage(langService.get('confirm_seq_wf_class_change'))
                        .then(function () {
                            _setIncomingDocType();
                        })
                        .catch(function (error) {
                            self.selectedDocClass = angular.copy(self.sequentialWorkflow.docClassID);
                        })
                }
            };

            /**
             * @description Checks if incoming document class
             * @param docClassId
             * @returns {boolean}
             * @private
             */
            function _isIncomingSeqWF(docClassId) {
                return docClassId === documentClassMap.incoming;
            }

            /**
             * @description Save the sequential workflow
             * @param $event
             */
            self.saveSequentialWorkflow = function ($event) {
                if (self.viewOnly || !self.isValidForm()) {
                    return;
                } else if (self.sequentialWorkflow.stepRows.length < minimumStepsCount) {
                    toast.info(langService.get('error_min_steps').change({number: minimumStepsCount}));
                    return;
                }
                self.editMode ? _updateSequentialWorkflow() : _addSequentialWorkflow();
            };

            var _addSequentialWorkflow = function () {
                self.sequentialWorkflow.creatorId = employeeService.getEmployee().id;
                self.sequentialWorkflow.creatorOUId = employeeService.getEmployee().getOUID();
                sequentialWorkflowService.addSequentialWorkflow(self.sequentialWorkflow)
                    .then(function (result) {
                        dialog.hide(result);
                    });
            };

            var _updateSequentialWorkflow = function () {
                sequentialWorkflowService.updateSequentialWorkflow(self.sequentialWorkflow)
                    .then(function (result) {
                        dialog.hide(result);
                    });
            };

            self.resetModel = function (form) {
                generator.resetFields(self.sequentialWorkflow, self.model);
                self.selectedDocClass = angular.copy(self.model.docClassID);

                form = form || self.form;
                if (form) {
                    form.$setUntouched();
                }
                _setRedrawSteps();
            };

            function _setRedrawSteps() {
                self.redrawSteps = true;
                $timeout(function () {
                    self.redrawSteps = false;
                }, 100);
            }

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
                    self.form = $scope.sequentialWorkflowForm || null;
                    // if add seqWF and default document class exists, set it to seqWF and model and handle change of docClass
                    if (!self.editMode && generator.validRequired(defaultDocClass)) {
                        self.selectedDocClass = defaultDocClass;
                        self.sequentialWorkflow.docClassID = defaultDocClass;
                        self.model = angular.copy(self.sequentialWorkflow);
                        self.handleDocTypeChange(_isIncomingSeqWF(self.selectedDocClass) || !!self.sequentialWorkflow.isAdhoc || !!self.sequentialWorkflow.isSubWorkflow);
                    }
                });
            };
        }
    );
};
