module.exports = function (app) {
    app.controller('manageSubscriptionsPopCtrl', function (dialog, documentSubscriptions, userSubscriptions, $q, langService, userSubscriptionService, employeeService, toast) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageSubscriptionsPopCtrl';
        self.documentSubscriptions = documentSubscriptions;
        self.userSubscriptions = userSubscriptions.filter(function (subscription) {
            return subscription.trigerId === documentSubscriptions.length? -1 : documentSubscriptions[0].lookupKey;
        });
        self.selectedUserSubscriptions = [];
        self.lookupKey = null;
        self.progress = null;

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
        self.filterUserSubscriptions = function(lookupKey){
            self.lookupKey = lookupKey;
            self.userSubscriptions = userSubscriptions.filter(function (subscription) {
                return subscription.trigerId === lookupKey;
            })

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
                    self.filterUserSubscriptions(self.lookupKey);
                    self.selectedUserSubscriptions = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return self.userSubscriptions;
                });
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
            self.statusServices[status](self.selectedUserSubscriptions).then(function () {
                self.reloadUserSubscriptions(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
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