module.exports = function (app) {
    app.controller('selectSequentialWorkflowPopCtrl', function (_,
                                                                dialog,
                                                                $timeout,
                                                                sequentialWorkflowService,
                                                                sequentialWorkflows) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectSequentialWorkflowPopCtrl';
        self.stepsUsageType = sequentialWorkflowService.stepsUsageTypes.manageWFSteps;
        self.sequentialWorkflows = sequentialWorkflows;
        self.selectedSeqWF = null;
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
