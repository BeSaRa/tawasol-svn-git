module.exports = function (app) {
    app.controller('viewSeqWfStepsPopCtrl', function (dialog,
                                                      toast,
                                                      _,
                                                      langService,
                                                      employeeService,
                                                      sequentialWorkflowService) {
        'ngInject';
        var self = this,
            minimumStepsCount = 2;
        self.controllerName = 'viewSeqWfStepsPopCtrl';

        self.stepsUsageType = sequentialWorkflowService.stepsUsageTypes.viewWFSteps;
        self.canAddSubSeqWF = employeeService.hasPermissionTo('ADD_SEQ_WF');

        self.isValidSeqWF = function () {
            return _isValidSteps() && _hasOneAuthorizeAndSend();
        };

        self.isValidSubSeqWF = function () {
            return _isValidSteps(true);
        }

        function _isValidSteps(isSubSeqWF) {
            if (!_hasStepRows(isSubSeqWF)) {
                return false;
            }
            var rows = self.sequentialWF.stepRows;
            if (isSubSeqWF) {
                rows = _.filter(self.sequentialWF.stepRows, 'isSelectedForSubSeqWF');
            }

            return _.every(rows, function (stepRow) {
                if (!stepRow) {
                    return false;
                }
                return stepRow.isValidStep(self.sequentialWF);
            })
        }

        function _hasOneAuthorizeAndSend(isSubSeqWF) {
            if (!_hasStepRows(isSubSeqWF)) {
                return false;
            }
            if (self.sequentialWF.isIncomingSeqWF()) {
                return true;
            } else {
                var rows = self.sequentialWF.stepRows;
                if (isSubSeqWF) {
                    rows = _.filter(self.sequentialWF.stepRows, 'isSelectedForSubSeqWF');
                }
                return !!_.find(rows, function (stepRow) {
                    if (!stepRow) {
                        return false;
                    }
                    return stepRow.isAuthorizeAndSendStep();
                })
            }
        }

        function _hasStepRows(isSubSeqWF) {
            if (isSubSeqWF) {
                return self.sequentialWF.stepRows && _.some(self.sequentialWF.stepRows, 'isSelectedForSubSeqWF');
            }
            return self.sequentialWF.stepRows && self.sequentialWF.stepRows.length;
        }

        self.saveSeqWF = function () {
            if (self.sequentialWF.stepRows.length < minimumStepsCount) {
                toast.info(langService.get('error_min_steps').change({number: minimumStepsCount}));
                return;
            }

            sequentialWorkflowService.updateSequentialWorkflow(self.sequentialWF)
                .then(function (result) {
                    toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    dialog.hide('SEQ_WF_UPDATED');
                });
        };

        self.saveAsSubSeqWF = function ($event) {
            if (_.filter(self.sequentialWF.stepRows, 'isSelectedForSubSeqWF').length < 1) {
                toast.info(langService.get('error_min_steps').change({number: 1}));
                return;
            }
            sequentialWorkflowService.controllerMethod
                .sequentialWorkflowCopy($event, self.sequentialWF, employeeService.getEmployee().getRegistryOUID(), false, true, false)
                .then(function (result) {
                    toast.success(langService.get('add_success').change({name: result.getNames()}));
                });

        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };
    });
};
