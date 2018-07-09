module.exports = function (app) {
    app.controller('manageSubscriptionsPopCtrl', function (dialog,
                                                           lookupService,
                                                           userSubscriptions,
                                                           $q,
                                                           langService,
                                                           userSubscriptionService,
                                                           employeeService,
                                                           toast,
                                                           generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageSubscriptionsPopCtrl';
        self.documentSubscriptions = lookupService.returnLookups(lookupService.documentSubscription);
        self.userSubscriptions = [];    //by default, set it to [], because we will filter it on change of event
        self.userSubscriptionsCopy = angular.copy(userSubscriptions);

        self.selectedUserSubscriptions = [];
        self.progress = null;
        self.subscriptionEvent = null;


        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return ( self.userSubscriptions.length + 21);
                    }
                }
            ]
        };

        /**
         * @description filter UserSubscriptions by trigger id.
         */
        self.filterUserSubscriptions = function () {
            if (self.subscriptionEvent) {
                self.userSubscriptions = _.filter(self.userSubscriptionsCopy, function (subscription) {
                    return subscription.trigerId === self.subscriptionEvent.lookupKey;
                });
            }
            else {
                self.userSubscriptions = [];
            }
            self.selectedUserSubscriptions = [];
            self.grid.page = 1;
        };

        /**
         * @description Reload the grid of user subscriptions
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadUserSubscriptions = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return userSubscriptionService
                .loadUserSubscriptionsByUserId(employeeService.getEmployee().id)
                .then(function (result) {
                    self.userSubscriptions = result;
                    self.userSubscriptionsCopy = angular.copy(result);
                    self.filterUserSubscriptions();

                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return self.userSubscriptions;
                });
        };

        /**
         * @description Contains methods for CRUD operations for User Subscriptions
         */
        self.statusServices = {
            'activate': userSubscriptionService.activateBulkUserSubscriptions,
            'deactivate': userSubscriptionService.deactivateBulkUserSubscriptions,
            'true': userSubscriptionService.activateUserSubscription,
            'false': userSubscriptionService.deactivateUserSubscription
        };


        /**
         * @description Delete single user Subscription
         * @param userSubscription
         * @param $event
         */
        self.removeUserSubscription = function (userSubscription, $event) {
            userSubscriptionService
                .controllerMethod
                .userSubscriptionDelete(userSubscription, $event)
                .then(function () {
                    self.reloadUserSubscriptions(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected user Subscriptions
         * @param $event
         */
        self.removeBulkUserSubscriptions = function ($event) {
            userSubscriptionService
                .controllerMethod
                .userSubscriptionDeleteBulk(self.selectedUserSubscriptions, $event)
                .then(function () {
                    self.reloadUserSubscriptions(self.grid.page);
                });
        };

        /**
         * @description Change the status of user Subscription
         * @param userSubscription
         */
        self.changeStatusUserSubscription = function (userSubscription) {
            self.statusServices[userSubscription.status](userSubscription)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    userSubscription.status = !userSubscription.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };


        /**
         * @description Change the status of selected User Subscriptions
         * @param status
         */
        self.changeStatusBulkUserSubscriptions = function (status) {
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedUserSubscriptions, statusCheck)) {
                //toast.error(langService.get('the_status_already_changed'));
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }
            self.statusServices[status](self.selectedUserSubscriptions).then(function () {
                self.reloadUserSubscriptions(self.grid.page).then(function () {
                    //toast.success(langService.get('selected_status_updated'));
                });
            });
        };


        /**
         * @description close reason reason.
         */
        self.closeSubscriptionsPopPopup = function () {
            dialog.cancel();
        };
    });
};