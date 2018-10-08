module.exports = function (app) {
    app.service('mailNotificationService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     MailNotification,
                                                     userSubscriptionService,
                                                     _) {
        'ngInject';
        var self = this;
        self.serviceName = 'mailNotificationService';

        self.notifications = [];
        self.unreadNotificationsCount = 0;
        self.notificationsRequestCount = 5;
        self.loadMailNotifications = function (count) {
            count = count ? count : self.notificationsRequestCount;
            return $http
                .get(urlService.notifications.change({count: count}), {
                    excludeLoading: true
                })
                .then(function (result) {
                    var notifications = result.data.rs.first;
                    self.unreadNotificationsCount = _.filter(notifications, {'isOpen': false}).length;
                    self.notifications = generator.interceptReceivedCollection('MailNotification', generator.generateCollection(notifications, MailNotification));

                    userSubscriptionService.userSubscriptions = result.data.rs.second;

                    return self.notifications;
                })
        };
    });
};
