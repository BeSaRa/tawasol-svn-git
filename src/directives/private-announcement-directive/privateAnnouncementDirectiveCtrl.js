module.exports = function (app) {
    app.controller('privateAnnouncementDirectiveCtrl', function (lookupService,
                                                                 $q,
                                                                 langService,
                                                                 toast,
                                                                 cmsTemplate,
                                                                 employeeService,
                                                                 $sce,
                                                                 privateAnnouncementService,
                                                                 dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'privateAnnouncementDirectiveCtrl';
        self.service = privateAnnouncementService;
        self.progress = null;

        /**
         * @description open popup to show private announcements, if not available then show alert
         * @param $event
         */
        self.showPrivateAnnouncements = function ($event) {
            if (self.service.count === 0) {
                dialog.alertMessage(langService.get("no_private_announcement"));
                return;
            }

            dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('show-private-announcement'),
                    controller: 'showPrivateAnnouncementPopCtrl',
                    controllerAs: 'ctrl',
                    resolve: {
                        privateAnnouncements: function (privateAnnouncementService) {
                            'ngInject';
                            return privateAnnouncementService.getPrivateAnnouncementByOUID().then(function (result) {
                                self.countPrivateAnnouncements = result.length;
                                return result;
                            });
                        }
                    }
                });
        };


        self.getPrivateAnnouncementsCount = function () {
            if (!employeeService.isAdminUser())
                privateAnnouncementService.getPrivateAnnouncementByOUID();
        };

        self.getPrivateAnnouncementsCount();
    });
};
