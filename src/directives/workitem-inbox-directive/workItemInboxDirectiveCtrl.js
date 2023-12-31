module.exports = function (app) {
    app.controller('workItemInboxDirectiveCtrl', function ($scope,
                                                           employeeService,
                                                           LangWatcher,
                                                           langService,
                                                           _,
                                                           generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'workItemInboxDirectiveCtrl';
        self.langService = langService;
        LangWatcher($scope);
        self.employeeService = employeeService;
        self.employee = employeeService.getEmployee();

        self.gridLegends = [
            'docClass', 'hasAttachment', 'hasLinkedDocuments', 'paperElectronic', 'securityLevel', 'priorityLevel',
            'followupStatus', 'isReassigned', 'siteFollowUpDueDate', 'siteFollowUpEnded', 'sequentialWF', 'conditionalApprove',
            'outgoingInternal'
        ];//, 'broadcast'

        self.canShowBulkStar = function (starUnStar) {
            var starOption = {
                'starBulk': false,
                'unStarBulk': true
            };
            if (!self.selectedWorkItems.length)
                return false;

            return _.some(self.selectedWorkItems, (workItem) => {
                return workItem.generalStepElm.starred === starOption[starUnStar];
            })
        }

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };
    });
};
