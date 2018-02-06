module.exports = function (app) {
    app.controller('documentsNotifyDirectiveCtrl', function (mailNotificationService,
                                                             employeeService,
                                                             $controller,
                                                             $interval,
                                                             correspondenceService,
                                                             userInboxService,
                                                             followupEmployeeInboxService) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentsNotifyDirectiveCtrl';

        self.mailService = mailNotificationService;

        angular.extend(this, $controller('userInboxCtrl', {
            userInboxes: [],
            userFolders: []
        }));

        self.openNotificationMenu = function ($mdMenu) {
            if (self.mailService.notifications.length)
                $mdMenu.open();
        };


        self.openNotificationItem = function (item, $event) {
            $event.preventDefault();
            var wobNumber = item.workObjectNumber;
            correspondenceService.viewCorrespondence(item, self.gridActions)
                .then(function () {
                    self.mailService.loadMailNotifications(5);
                    _.map(userInboxService.userInboxes, function (workItem) {
                        if (workItem.generalStepElm.workObjectNumber === wobNumber)
                            workItem.generalStepElm.isOpen = true;
                        return workItem;
                    });
                    _.map(followupEmployeeInboxService.followupEmployeeInboxes, function (workItem) {
                        if (workItem.generalStepElm.workObjectNumber === wobNumber)
                            workItem.generalStepElm.isOpen = true;
                        return workItem;
                    });
                })
                .catch(function () {
                    self.mailService.loadMailNotifications(5);
                    _.map(userInboxService.userInboxes, function (workItem) {
                        if (workItem.generalStepElm.workObjectNumber === wobNumber)
                            workItem.generalStepElm.isOpen = true;
                        return workItem;
                    });
                    _.map(followupEmployeeInboxService.followupEmployeeInboxes, function (workItem) {
                        if (workItem.generalStepElm.workObjectNumber === wobNumber)
                            workItem.generalStepElm.isOpen = true;
                        return workItem;
                    });

                });
        };

        if (!employeeService.isAdminUser()) {
            // reload notifications
            self.mailService.loadMailNotifications(5);

            $interval(function () {
                self.mailService.loadMailNotifications(5);
            }, employeeService.getEmployee().getIntervalMin());
        }

    });
};
