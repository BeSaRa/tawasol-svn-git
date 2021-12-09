module.exports = function (app) {
    app.service('desktopNotificationService', function ($window, rootEntity, $q) {
        'ngInject';
        var self = this;
        self.serviceName = 'desktopNotificationService';

        function _getNotificationIcon() {
            return rootEntity.getGlobalSettings().bannerLogo.fileUrl;
        }

        /**
         * @description to check if the current browser support Notification or no.
         * @returns {boolean}
         */
        self.isDesktopNotificationAvailable = function () {
            return 'Notification' in $window;
        };

        self.askForPermission = function () {
            return Notification.requestPermission();
        };

        self.displayNotification = function (title, body) {
            return new Notification(title, {
                body: body,
                icon: _getNotificationIcon()
            });
        }


    });
};
