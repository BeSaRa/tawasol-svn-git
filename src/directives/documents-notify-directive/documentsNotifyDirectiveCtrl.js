module.exports = function (app) {
    app.controller('documentsNotifyDirectiveCtrl', function (mailNotificationService,
                                                             employeeService,
                                                             $controller,
                                                             $interval,
                                                             $scope,
                                                             $http,
                                                             WorkItem,
                                                             correspondenceService,
                                                             userInboxService,
                                                             followupEmployeeInboxService) {
        'ngInject';
        var self = this;


        self.mailService = mailNotificationService;

        var userInboxCtrl = $controller('userInboxCtrl', {
            userInboxes: [],
            userFolders: [],
            userFilters: [],
            $scope: $scope ,
            fromNotification : true
        });
        userInboxCtrl.controllerName = 'documentsNotifyDirectiveCtrl';
        angular.extend(this, userInboxCtrl);

        self.openNotificationMenu = function ($mdMenu) {
            if (self.mailService.notifications.length)
                $mdMenu.open();
        };

        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = false;
            if (info.documentClass === "internal") {
                //If approved internal electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            }
            else if (info.documentClass === "incoming")
                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
            else if (info.documentClass === "outgoing") {
                //If approved outgoing electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            }
            if (checkForViewPopup)
                return !hasPermission;
            return hasPermission;
        };


        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowed = (hasPermission && info.documentClass !== "internal");
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        self.openNotificationItem = function (item, $event) {
            $event.preventDefault();
            var wobNumber = item.workObjectNumber;
            var info = item.getInfo();
            var workItem = new WorkItem({
                generalStepElm: {
                    docType: item.docType,
                    docSubject: info.title,
                    vsId: info.vsId,
                    workObjectNumber: info.wobNumber,
                    securityLevel: item.securityLevel,
                    docStatus: info.docStatus
                }
            });

            workItem.viewNewWorkItemDocument(self.gridActions, 'userInbox', $event)
                .then(function () {
                    self.mailService.loadMailNotifications(self.mailService.notificationsRequestCount);
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
                    self.mailService.loadMailNotifications(self.mailService.notificationsRequestCount);
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
        var interval;

        if (!employeeService.isAdminUser()) {
            var stopNotification = false;
            // reload notifications
            self.mailService.loadMailNotifications(self.mailService.notificationsRequestCount);
            interval = $interval(function () {
                if (stopNotification) {
                    $interval.cancel(interval);
                    return;
                }
                return self.mailService.loadMailNotifications(self.mailService.notificationsRequestCount)
                    .catch(function () {
                        $interval.cancel(interval);
                        stopNotification = true;
                    });
            }, employeeService.getEmployee().getIntervalMin());
        }

    });
};
