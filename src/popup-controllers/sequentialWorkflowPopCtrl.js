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
                                                          sequentialWorkflow,
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

            self.form = null;
            self.editMode = editMode;
            self.viewOnly = viewOnly;
            self.redrawSteps = false;
            self.sequentialWorkflow = sequentialWorkflow;
            self.model = angular.copy(self.sequentialWorkflow);
            self.selectedDocClass = self.model.docClassID;

            self.documentClasses = lookupService.returnLookups(lookupService.documentClass);

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
                return form.$valid && _isValidSteps() && _isLastStepValid();
            };

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

            function _isLastStepValid() {
                if (self.sequentialWorkflow.isIncomingSeqWF()) {
                    return true;
                }
                return _.last(self.sequentialWorkflow.stepRows).isAuthorizeAndSendStep();
            }

            /**
             * @description Checks if value exists
             * @param value
             * @returns {boolean|boolean}
             * @private
             */

            self.hasValue = function (value) {
                return typeof value !== 'undefined' && value !== null;
            };

            /**
             * @description Handles the change of document type to manage steps
             */
            self.handleDocTypeChange = function () {
                if (self.viewOnly || self.model.id) {
                    self.selectedDocClass = angular.copy(self.sequentialWorkflow.docClassID);
                    return;
                }
                // if there is no selected value or there is selected value and new value is not incoming,set the selected class to seqWF
                // otherwise, confirm remove steps
                if (!self.hasValue(self.sequentialWorkflow.docClassID) || !_isIncomingSeqWF(self.selectedDocClass)) {
                    self.sequentialWorkflow.docClassID = angular.copy(self.selectedDocClass);
                } else {
                    dialog.confirmMessage(langService.get('confirm_seq_wf_class_change'))
                        .then(function () {
                            self.sequentialWorkflow.docClassID = angular.copy(self.selectedDocClass);
                            self.sequentialWorkflow.steps = [];
                            self.sequentialWorkflow.stepRows = [];
                            _setRedrawSteps();
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
                } else if (!_isLastStepValid()) {
                    toast.info(langService.get('seq_wf_last_step_note'));
                    return;
                }
                self.editMode ? _updateSequentialWorkflow() : _addSequentialWorkflow();
            };

            var _addSequentialWorkflow = function () {
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
             * @description Close the popup
             */
            self.closePopup = function ($event) {
                dialog.cancel();
            };

            self.$onInit = function () {
                $timeout(function () {
                    self.form = $scope.sequentialWorkflowForm || null;
                });
            };
        }
    );
};
