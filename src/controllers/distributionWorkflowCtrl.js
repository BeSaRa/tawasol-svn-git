module.exports = function (app) {
    app.controller('distributionWorkflowCtrl', function (lookupService,
                                                         distributionWorkflowService,
                                                         distributionWorkflows,
                                                         $q,
                                                         langService,
                                                         toast,
                                                         dialog,
                                                         //organizations,
                                                         //actions,
                                                         cmsTemplate) {
        'ngInject';
        var self = this;

        self.controllerName = 'distributionWorkflowCtrl';

        self.progress = null;

        /**
         * @description All distribution Workflows
         * @type {*}
         */
        self.distributionWorkflows = distributionWorkflows;

        /**
         * @description Contains the selected distribution Workflows
         * @type {Array}
         */
        self.selectedDistributionWorkflows = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.distributionWorkflows.length + 21);
                    }
                }
            ]
        };

        self.openDistributionWorkflowDialog = function ($event) {
            return distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSend(null, false, false, null, $event)
                .then(function () {

                })
                .catch(function () {

                });
        };

    });
};