module.exports = function (app) {
    app.controller('showPrivateAnnouncementPopCtrl', function (privateAnnouncements,
                                                               lookupService,
                                                               $q,
                                                               langService,
                                                               toast,
                                                               $timeout,
                                                               dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'showPrivateAnnouncementPopCtrl';
        self.progress = null;
        self.privateAnnouncements = privateAnnouncements;

        self.closeShowPrivateAnnouncementPopupFromCtrl = function () {
            dialog.cancel();
        };

        $timeout(function () {
            if (self.isCloseAutomatically)
                dialog.cancel();
        }, 8000);

    });
};
