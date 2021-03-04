module.exports = function (app) {
    app.controller('selectSequentialWorkflowPopCtrl', function (_,
                                                                dialog,
                                                                $timeout,
                                                                sequentialWorkflowService,
                                                                sequentialWorkflows,
                                                                allowDelete,
                                                                employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectSequentialWorkflowPopCtrl';
        self.stepsUsageType = sequentialWorkflowService.stepsUsageTypes.selectSeqWF;
        self.sequentialWorkflows = sequentialWorkflows;
        self.selectedSeqWF = null;
        self.allowDelete = allowDelete;
        self.employeeService = employeeService;
        self.seqWFSearchText = '';

        /**
         * @description Handles the change of sequential workflow
         */
        self.onChangeSequentialWorkflow = function () {
            self.redrawSteps = true;
            $timeout(function () {
                self.redrawSteps = false;
            }, 100);
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
         * @description Delete the selected seqWF
         * @param $event
         */
        self.deleteSeqWF = function ($event) {
            if (!employeeService.hasPermissionTo('ADD_SEQ_WF') || !self.selectedSeqWF) {
                return;
            }
            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowDelete(self.selectedSeqWF, $event)
                .then(function () {
                    self.sequentialWorkflows = self.sequentialWorkflows.filter(item => item.id !== self.selectedSeqWF.id);
                    self.selectedSeqWF = null;
                    self.onChangeSequentialWorkflow();
                });
        }

        /**
         * @description Closes popup with selected seqWF
         */
        self.importSeqWF = function () {
            if (!self.selectedSeqWF) {
                return;
            }
            dialog.hide(self.selectedSeqWF);
        }

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
