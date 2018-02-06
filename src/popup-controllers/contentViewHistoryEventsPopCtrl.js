module.exports = function (app) {
    app.controller('contentViewHistoryEventsPopCtrl', function (_,
                                                                generator,
                                                                dialog,
                                                                langService,
                                                                contentViewHistoryEvents,
                                                                contentViewHistorySubject) {
        'ngInject';
        var self = this;
        self.controllerName = 'contentViewHistoryEventsPopCtrl';
        self.contentViewHistoryEvents = angular.copy(contentViewHistoryEvents);
        self.contentViewHistorySubject = contentViewHistorySubject;
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.contentViewHistoryEvents.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Close the popup
         */
        self.closeContentViewHistoryEventsPopupFromCtrl = function () {
            dialog.cancel();
        }
    });
};