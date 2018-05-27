module.exports = function (app) {
    app.service('userSubscriptionService', function (urlService,
                                                        $http,
                                                        $q,
                                                        generator,
                                                        UserSubscription) {
        'ngInject';
        var self = this;
        self.serviceName = 'userSubscriptionService';

        self.userSubscriptions = [];
        self.userSubscriptionsToShow = [];
        self.count = 0;

        /**
         * @description Load the user Subscriptions from server.
         * @returns {Promise|userSubscriptions}
         */
        self.loadUserSubscriptions = function (userid) {
            return $http.get(urlService.userSubscriptions+ '/user-id/' + userid).then(function (result) {
                self.userSubscriptions = generator.generateCollection(result.data.rs, UserSubscription, self._sharedMethods);
                self.userSubscriptions = generator.interceptReceivedCollection('UserSubscription', self.userSubscriptions);
                self.count = self.userSubscriptions.length;
                return self.userSubscriptions;
            });
        };

        /**
         * @description Get User Subscriptions from self.userSubscriptions if found and if not load it from server again.
         * @returns {Promise|userSubscriptions}
         */
        self.getUserSubscriptions = function (userid) {
            return self.userSubscriptions.length ? $q.when(self.userSubscriptions) : self.loadUserSubscriptions(userid);
        };


        /**
         * @description Add new user Subscription
         * @param userSubscription
         * @return {Promise|UserSubscription}
         */
        self.addUserSubscription = function (userSubscription) {
            return $http
                .post(urlService.userSubscriptions,
                    generator.interceptSendInstance('UserSubscription', userSubscription))
                .then(function (result) {
                    return generator.interceptReceivedInstance('UserSubscription', generator.generateInstance(result.data.rs, UserSubscription, self._sharedMethods));
                });
        };


    });
};
