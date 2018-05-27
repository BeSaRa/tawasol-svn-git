module.exports = function (app) {
    app.controller('userSubscriptionDirectiveCtrl', function (lookupService,
                                                                 $q,
                                                                 langService,
                                                                 toast,
                                                                 cmsTemplate,
                                                                 employeeService,
                                                                 $sce,
                                                                 userSubscriptionService,
                                                                 dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'userSubscriptionDirectiveCtrl';
        self.service = userSubscriptionService;
        self.progress = null;

        /**
         * @description open popup to show User Subscriptions, if not available then show alert
         * @param $event
         */
        self.showUserSubscriptions = function ($event) {
            if (self.service.count === 0) {
                dialog.alertMessage(langService.get("no_user_subscriptions"));
                return;
            }

            dialog
                .showDialog({
                    targetEvent: $event,
                    template: cmsTemplate.getPopup('show-user-subscription'),
                    controller: 'showUserSubscriptionsPopCtrl',
                    controllerAs: 'showUserSubscriptionsCtrl',
                    resolve: {
                        userSubscriptions: function (userSubscriptionService) {
                            'ngInject';
                            return userSubscriptionService.getUserSubscriptions(employeeService.getEmployee().id).then(function (result) {
                                self.countUserSubscriptions = result.length;
                                return result;
                            });
                        }
                    }
                });
        };

        self.getUserSubscriptionsCount = function () {
            userSubscriptionService.getUserSubscriptions(employeeService.getEmployee().id);
        };

        self.getUserSubscriptionsCount();

    });
};