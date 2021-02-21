module.exports = function (app) {
    app.controller('viewSeqWfStepsPopCtrl', function (dialog,
                                                      toast,
                                                      _,
                                                      langService,
                                                      sequentialWorkflowService) {
        'ngInject';
        var self = this,
            minimumStepsCount = 2;
        self.controllerName = 'viewSeqWfStepsPopCtrl';

        self.stepsUsageType = sequentialWorkflowService.stepsUsageTypes.viewWFSteps;

        self.isValidSeqWF = function () {
            return _isValidSteps() && _hasOneAuthorizeAndSend();
        };

        function _isValidSteps() {
            if (!_hasStepRows()) {
                return false;
            }
            return _.every(self.sequentialWF.stepRows, function (stepRow) {
                if (!stepRow) {
                    return false;
                }
                return stepRow.isValidStep(self.sequentialWF);
            })
        }

        function _hasOneAuthorizeAndSend() {
            if (!_hasStepRows()) {
                return false;
            }
            if (self.sequentialWF.isIncomingSeqWF()) {
                return true;
            } else {
                return !!_.find(self.sequentialWF.stepRows, function (stepRow) {
                    if (!stepRow) {
                        return false;
                    }
                    return stepRow.isAuthorizeAndSendStep();
                })
            }
        }

        function _hasStepRows() {
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

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
