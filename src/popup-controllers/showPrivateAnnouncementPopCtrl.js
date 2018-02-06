module.exports = function (app) {
    app.controller('showPrivateAnnouncementPopCtrl', function (privateAnnouncements,
                                                               lookupService,
                                                               $q,
                                                               langService,
                                                               toast,
                                                               dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'showPrivateAnnouncementPopCtrl';
        self.progress = null;

        self.privateAnnouncements = privateAnnouncements;

        self.closeShowPrivateAnnouncementPopupFromCtrl = function () {
            dialog.cancel();
        };

    });
};