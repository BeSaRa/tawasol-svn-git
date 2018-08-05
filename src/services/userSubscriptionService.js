module.exports = function (app) {
    app.service('userSubscriptionService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     UserSubscription,
                                                     lookupService,
                                                     dialog,
                                                     cmsTemplate,
                                                     langService,
                                                     toast) {
        'ngInject';
        var self = this;
        self.serviceName = 'userSubscriptionService';
        self.userSubscriptions = [];
        self.userSubscriptionsByUserId = [];

        /**
         * @description Load the user Subscriptions for notifications.
         * @returns {Promise|userSubscriptions}
         */
        self.loadUserSubscriptions = function () {
            $http.get(urlService.notifications.change({count: 10}), {
                excludeLoading: true
            })
                .then(function (result) {
                    self.userSubscriptions = result.data.rs.second;
                    return self.userSubscriptions;
                });
        };

        /**
         * @description Get User Subscriptions from self.userSubscriptions if found and if not load it from server again.
         * @returns {Promise|userSubscriptions}
         */
        self.getUserSubscriptions = function () {
            return self.userSubscriptions && self.userSubscriptions.length ? $q.when(self.userSubscriptions) : self.loadUserSubscriptions();
        };

        /**
         * @description Loads the user subscriptions for particular document by vsId
         * @param vsId
         * @returns {*}
         */
        self.getSubscriptionsByVsId = function (vsId) {
            vsId = vsId.hasOwnProperty('vsId') ? vsId.vsId : vsId;
            return $http.get(urlService.userSubscriptions + '/vsid/' + vsId)
                .then(function (result) {
                    result = generator.generateCollection(result.data.rs, UserSubscription, self._sharedMethods);
                    return result;
                });
        };

        /**
         * @description Load the user Subscriptions by userId from server.
         * @returns {Promise|userSubscriptions}
         */
        self.loadUserSubscriptionsByUserId = function (userid) {
            return $http.get(urlService.userSubscriptions + '/user-id/' + userid).then(function (result) {
                self.userSubscriptionsByUserId = generator.generateCollection(result.data.rs, UserSubscription, self._sharedMethods);
                self.userSubscriptionsByUserId = generator.interceptReceivedCollection('UserSubscription', self.userSubscriptionsByUserId);
                return self.userSubscriptionsByUserId;
            });
        };

        /**
         * @description Get User Subscriptions from self.userSubscriptions if found and if not load it from server again.
         * @returns {Promise|userSubscriptions}
         */
        self.getUserSubscriptionsByUserId = function (userid) {
            return self.userSubscriptionsByUserId.length ? $q.when(self.userSubscriptionsByUserId) : self.loadUserSubscriptionsByUserId(userid);
        };

        /**
         * @description Contains methods for CRUD operations for user Subscriptions
         */
        self.controllerMethod = {
            /**
             * @description  open subscription event types dialog
             * @param record
             * @param $event
             * @returns {promise|*}
             */
            openAddSubscriptionDialog: function (record, $event) {
                var info = record.getInfo();
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('subscription-event-type'),
                        controller: 'subscriptionPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        targetEvent: $event,
                        locals: {
                            info: info
                        },
                        resolve: {
                            eventTypes: function (lookupService) {
                                'ngInject';
                                return lookupService.returnLookups(lookupService.documentSubscription);
                            },
                            existingSubscriptions: function () {
                                'ngInject';
                                return self.getSubscriptionsByVsId(info.vsId);
                            }
                        }
                    });
            },
            /**
             * @description Show confirm box and delete user Subscription
             * @param userSubscription
             * @param $event
             */
            userSubscriptionDelete: function (userSubscription, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: userSubscription.docSubject}), null, null, $event)
                    .then(function () {
                        return self.deleteUserSubscription(userSubscription).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: userSubscription.docSubject}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk user Subscriptions
             * @param userSubscriptions
             * @param $event
             */
            userSubscriptionDeleteBulk: function (userSubscriptions, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkUserSubscriptions(userSubscriptions);
                    });
            }
        };

        /**
         * @description Add new user Subscription
         * @param userSubscriptions
         * @param $event
         * @return {Promise|UserSubscription}
         */
        self.addUserSubscriptionBulk = function (userSubscriptions, $event) {
            return $http
                .post(urlService.userSubscriptions + '/add-bulk', generator.interceptSendCollection('UserSubscription', userSubscriptions))
                .then(function (result) {
                    return generator.getBulkActionResponse(result, userSubscriptions, false, 'failed_subscribe', 'subscribe_all_success', 'subscribe_success_except_following');
                })
                .catch(function (error) {
                    return errorCode.checkIf(error, 'CANNOT_ADD_SUBSCRIPTION_SAME_USER_SAME_BOOK', function () {
                        dialog.errorMessage(langService.get('cannot_add_subscription_same_user_same_book'));
                    });
                });
        };

        /**
         * @description Delete given user Subscription.
         * @param userSubscription
         * @return {Promise|null}
         */
        self.deleteUserSubscription = function (userSubscription) {
            var id = userSubscription.hasOwnProperty('id') ? userSubscription.id : userSubscription;
            return $http.delete((urlService.userSubscriptions + '/' + id)).then(function (result) {
                return result;
            });
        };

        /**
         * @description Delete bulk user Subscriptions.
         * @param userSubscriptions
         * @return {Promise|null}
         */
        self.deleteBulkUserSubscriptions = function (userSubscriptions) {
            var bulkIds = userSubscriptions[0].hasOwnProperty('id') ? _.map(userSubscriptions, 'id') : userSubscriptions;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.userSubscriptions + '/bulk',
                data: bulkIds
            }).then(function (result) {
                return generator.getBulkActionResponse(result, userSubscriptions, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following');
            });
        };


        /**
         * @description Activate user Subscription
         * @param userSubscription
         */
        self.activateUserSubscription = function (userSubscription) {
            return $http.put(urlService.userSubscriptions + '/activate/' + userSubscription.id)
                .then(function () {
                    return userSubscription;
                });
        };

        /**
         * @description Deactivate user Subscription
         * @param userSubscription
         */
        self.deactivateUserSubscription = function (userSubscription) {
            return $http
                .put((urlService.userSubscriptions + '/deactivate/' + userSubscription.id))
                .then(function () {
                    return userSubscription;
                });
        };

        /**
         * @description Activate bulk of user Subscriptions
         * @param userSubscriptions
         */
        self.activateBulkUserSubscriptions = function (userSubscriptions) {
            var bulkIds = userSubscriptions[0].hasOwnProperty('id') ? _.map(userSubscriptions, 'id') : userSubscriptions;
            return $http
                .put((urlService.userSubscriptions + '/activate/bulk'), bulkIds)
                .then(function (result) {
                    return generator.getBulkActionResponse(result, userSubscriptions, false, 'failed_activate_selected', 'success_activate_selected', 'success_activate_selected_except_following');
                    //return userSubscriptions;
                });
        };

        /**
         * @description Deactivate bulk of user Subscriptions
         * @param userSubscriptions
         */
        self.deactivateBulkUserSubscriptions = function (userSubscriptions) {
            var bulkIds = userSubscriptions[0].hasOwnProperty('id') ? _.map(userSubscriptions, 'id') : userSubscriptions;
            return $http
                .put((urlService.userSubscriptions + '/deactivate/bulk'), bulkIds)
                .then(function (result) {
                    return generator.getBulkActionResponse(result, userSubscriptions, false, 'failed_deactivate_selected', 'success_deactivate_selected', 'success_deactivate_selected_except_following');
                    //return userSubscriptions;
                });
        };


    });
};
