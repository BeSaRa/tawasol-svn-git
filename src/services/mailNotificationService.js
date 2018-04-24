module.exports = function (app) {
    app.service('mailNotificationService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     MailNotification,
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
                    loading: false
                })
                .then(function (result) {
                    self.unreadNotificationsCount = _.filter(result.data.rs, {'read': false}).length;
                    self.notifications = generator.interceptReceivedCollection('MailNotification', generator.generateCollection(result.data.rs, MailNotification));
                    return self.notifications;
                })
                .catch(function () {
                    return [];
                });
        };
    });
};
