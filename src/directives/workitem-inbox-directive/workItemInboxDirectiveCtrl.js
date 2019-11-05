module.exports = function (app) {
    app.controller('workItemInboxDirectiveCtrl', function ($scope,
                                                           employeeService,
                                                           LangWatcher,
                                                           langService,
                                                           configurationService,
                                                           $sce,
                                                           generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'workItemInboxDirectiveCtrl';
        self.langService = langService;
        LangWatcher($scope);
        self.employeeService = employeeService;
        self.gridLegends = ['docClass', 'hasAttachment', 'hasLinkedDocuments', 'paperElectronic', 'securityLevel', 'priorityLevel', 'followupStatus', 'isReassigned'];//, 'broadcast'


        self.configurationService = configurationService;
        // for demo purpose
        self.userUrl = [
            $sce.trustAsResourceUrl('https://teams.microsoft.com/_?tenantId=77f2d86b-8cb0-466c-8712-07c6cd108168#/conversations/19:3cef6b79-d3c7-4228-9c5e-1f1def192573_45555d5f-11a3-464b-8906-b5eb4a3638eb@unq.gbl.spaces?groupId=f05515f6-f713-4811-b7ae-c4d17187ccd9&ctx=chat'),
            $sce.trustAsResourceUrl('https://teams.microsoft.com/_?tenantId=77f2d86b-8cb0-466c-8712-07c6cd108168#/conversations/8:orgid:43764101-79a8-4f7f-a0da-78192b8958b5?groupId=f05515f6-f713-4811-b7ae-c4d17187ccd9&ctx=chat')
        ];
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
