module.exports = function (app) {
    app.controller('showUserSubscriptionsPopCtrl', function (userSubscriptions,
                                                               lookupService,
                                                               $q,
                                                               langService,
                                                               toast,
                                                               dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'showUserSubscriptionsPopCtrl';
        self.progress = null;

        self.userSubscriptions = userSubscriptions;

        self.closeShowUserSubscriptionsPopupFromCtrl = function () {
            dialog.cancel();
        };

    });
};