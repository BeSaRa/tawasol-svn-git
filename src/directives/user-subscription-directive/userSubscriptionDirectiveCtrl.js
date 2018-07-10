module.exports = function (app) {
    app.controller('userSubscriptionDirectiveCtrl', function (lookupService,
                                                              $q,
                                                              langService,
                                                              toast,
                                                              cmsTemplate,
                                                              $sce,
                                                              userSubscriptionService,
                                                              dialog,
                                                              employeeService,
                                                              correspondenceService,
                                                              generator) {
        'ngInject';
        var self = this;

        self.controllerName = 'userSubscriptionDirectiveCtrl';
        self.service = userSubscriptionService;
        self.progress = null;


        self.openSubscriptionMenu = function ($mdMenu) {
            if (userSubscriptionService.userSubscriptions.length)
                $mdMenu.open();
            else
                dialog.alertMessage(langService.get("no_user_subscriptions"));
        };

        self.getSubscriptionEventType = function (selected) {
            var lang = langService.getCurrentLang();
            if (lang === 'en') {
                lang = 'En';
            }

            if (lang === 'ar') {
                lang = "Ar";
            }

            return lookupService.returnLookups(lookupService.documentSubscription).filter(function (item) {
                return item.lookupKey === selected;
            })[0]['default' + lang + 'Name'];
        };

        /**
         * @description Preview document
         * @param item
         * @param $event
         */
        self.previewDocument = function (item, $event) {
            $event.preventDefault();
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence({
                vsId: item.vsId,
                docClassName: generator.getDocumentClassName(item.docClassId)
            }, self.gridActions, false, true);
        };


        /**
         * @description View document
         * @param item
         * @param $event
         */
        self.viewDocument = function (item, $event) {
            $event.preventDefault();
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            console.log('view document');
        };


        /**
         * @description open popup to show User Subscriptions, if not available then show alert
         * @param $event
         */
        self.showUserSubscriptions = function ($event) {
            if (self.service.userSubscriptions.length === 0) {
                dialog.alertMessage(langService.get("no_user_subscriptions"));
                return;
            }

            dialog
                .showDialog({
                    targetEvent: $event,
                    template: cmsTemplate.getPopup('show-user-subscription'),
                    controller: 'showUserSubscriptionsPopCtrl',
                    controllerAs: 'ctrl',
                    resolve: {
                        userSubscriptions: function (userSubscriptionService) {
                            'ngInject';
                            return userSubscriptionService.getUserSubscriptions().then(function (result) {
                                self.countUserSubscriptions = result.length;
                                return result;
                            });
                        }
                    }
                });
        };

        self.getUserSubscriptionsCount = function () {
            userSubscriptionService.getUserSubscriptions();
        };

        self.getUserSubscriptionsCount();

    });
};