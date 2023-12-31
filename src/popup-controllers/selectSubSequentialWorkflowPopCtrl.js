module.exports = function (app) {
    app.controller('selectSubSequentialWorkflowPopCtrl', function (_,
                                                                   dialog,
                                                                   $timeout,
                                                                   sequentialWorkflowService,
                                                                   sequentialWorkflows,
                                                                   allowDelete,
                                                                   allowEdit,
                                                                   toast,
                                                                   langService,
                                                                   employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectSubSequentialWorkflowPopCtrl';
        self.stepsUsageType = sequentialWorkflowService.stepsUsageTypes.selectSeqWF;
        self.sequentialWorkflows = sequentialWorkflows;
        self.selectedSeqWF = null;
        self.allowDelete = allowDelete;
        self.allowEdit = allowEdit;
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
         * @description Reloads the sub sequential workflows
         * @param avoidResetSelected
         * @returns {*}
         */
        self.reloadSubSequentialWorkflows = function (avoidResetSelected) {
            return sequentialWorkflowService
                .loadSubSequentialWorkflowsByRegOu(employeeService.getEmployee().getRegistryOUID())
                .then(function (result) {
                    self.sequentialWorkflows = result;
                    var id = self.selectedSeqWF ? self.selectedSeqWF.id : null;
                    self.selectedSeqWF = null;
                    if (avoidResetSelected && id !== null) {
                        self.selectedSeqWF = _.find(self.sequentialWorkflows, {id: id});
                    }
                    self.onChangeSequentialWorkflow();
                    return result;
                });
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
        };

        /**
         * @description Edit the selected seqWF
         * @param $event
         */
        self.editSeqWF = function ($event) {
            if (!employeeService.hasPermissionTo('ADD_SEQ_WF') || !self.selectedSeqWF) {
                return;
            }
            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowEdit(self.selectedSeqWF, $event)
                .then(function (result) {
                    self.reloadSubSequentialWorkflows(true)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        })
                });
        };

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
