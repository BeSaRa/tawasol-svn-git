module.exports = function (app) {
    app.controller('subscriptionPopCtrl', function (dialog,
                                                    eventTypes,
                                                    _,
                                                    info,
                                                    generator,
                                                    $q,
                                                    toast,
                                                    $timeout,
                                                    langService,
                                                    //errorCode,
                                                    UserSubscription,
                                                    existingSubscriptions,
                                                    userSubscriptionService) {
            'ngInject';
            var self = this;
            self.controllerName = 'subscriptionPopCtrl';
            self.subscribingFor = null;

            $timeout(function () {
                self.existingSubscriptions = existingSubscriptions;
            });
            self.existingSubscriptionsCopy = angular.copy(self.existingSubscriptions);

            /**
             * @description Checks if event is already subscribed
             * @param event
             * @returns {boolean}
             */
            self.checkExistingEvent = function (event) {
                return !!_.find(self.existingSubscriptions, function (existingSubscription) {
                    return existingSubscription.trigerId === event.lookupKey;
                })
            };

            /**
             * @description Save the event subscriptions for the book
             * @param form
             * @param $event
             * @returns {Promise<any>}
             */
            self.saveSubscribe = function (form, $event) {
                var subscribingFor = [];
                for (var i = 0; i < self.subscribingFor.length; i++) {
                    subscribingFor.push(new UserSubscription({
                        trigerId: self.subscribingFor[i].lookupKey,
                        documentVSId: self.info.vsId,
                        status: true,
                        docSubject: self.info.title
                    }));
                }

                return userSubscriptionService.addUserSubscriptionBulk(subscribingFor, $event)
                    .then(function (result) {
                        self.subscribingFor = [];
                        self.reloadUserSubscriptions();
                        form.$setUntouched();
                    });
            };

            self.selectedUserSubscriptions = [];

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
                            return (self.existingSubscriptions.length + 21);
                        }
                    }
                ]
            };

            self.getSortedData = function () {
                return $filter('orderBy')(self.existingSubscriptions, self.grid.order);
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
                    .getSubscriptionsByVsId(info.vsId)
                    .then(function (result) {
                        self.existingSubscriptions = result;
                        self.existingSubscriptionsCopy = angular.copy(result);
                        self.selectedUserSubscriptions = [];
                        defer.resolve(true);
                        if (pageNumber)
                            self.grid.page = pageNumber;
                        return self.existingSubscriptions;
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
             * @description Contains methods for CRUD operations for User Subscriptions
             */
            self.statusServices = {
                'activate': userSubscriptionService.activateBulkUserSubscriptions,
                'deactivate': userSubscriptionService.deactivateBulkUserSubscriptions,
                'true': userSubscriptionService.activateUserSubscription,
                'false': userSubscriptionService.deactivateUserSubscription
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
                    toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                    return;
                }
                self.statusServices[status](self.selectedUserSubscriptions).then(function () {
                    self.reloadUserSubscriptions(self.grid.page);
                });
            };

            /**
             * @description close subscription event popup.
             */
            self.closeEventTypePopup = function () {
                dialog.cancel();
            };
        }
    );
};