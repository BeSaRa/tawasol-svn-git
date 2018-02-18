module.exports = function (app) {
    app.controller('groupInboxCtrl', function (langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'groupInboxCtrl';
        // selected workItems
        self.selectedWorkItems = [];
        // langService
        self.langService = langService;

        self.workItems = [];
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5,
            page: 1,
            order: '',
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.workItems.length + 21);
                    }
                }
            ]
        };

        /**
         * @description reload group Inbox grid
         */
        self.reloadGroupInbox = function () {

        };
        /**
         * @description terminate bulk group inbox
         */
        self.terminateBulkGroupInbox = function () {

        }


    });
};