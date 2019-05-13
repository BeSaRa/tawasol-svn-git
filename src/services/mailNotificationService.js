module.exports = function (app) {
    app.service('mailNotificationService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     MailNotification,
                                                     userSubscriptionService,
                                                     UserSubscription,
                                                     Indicator,
                                                     _) {
        'ngInject';
        var self = this;
        self.serviceName = 'mailNotificationService';

        self.notifications = [];
        self.unreadNotificationsCount = 0;
        self.notificationsRequestCount = 10;
        self.loadMailNotifications = function (count) {
            count = count ? count : self.notificationsRequestCount;
            return $http
                .get(urlService.notifications.change({count: count}), {
                    excludeLoading: true
                })
                .then(function (result) {
                    var notifications = result.data.rs.first;
                    var subscribtions = result.data.rs.second;

                    self.unreadNotificationsCount = _.filter(notifications, {'isOpen': false}).length;
                    self.notifications = generator.interceptReceivedCollection('MailNotification', generator.generateCollection(notifications, MailNotification));
                    userSubscriptionService.userSubscriptions = generator.interceptReceivedCollection('UserSubscription', generator.generateCollection(subscribtions,UserSubscription));

                    return self.notifications;
                })
        };
    });
};
