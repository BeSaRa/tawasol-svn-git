module.exports = function (app) {
    app.service('toast', function (langService,
                                   $mdToast,
                                   $log,
                                   _) {
        'ngInject';
        var self = this;

        /**
         * @description Shows the toast message according to the type passed to it. Type will make toast to identify success, error, warning, info
         * @param message
         * @param type
         * @param duration
         * @returns {promise}
         */
        self.show = function (message, type, duration) {
            var position = langService.current === 'ar' ? 'top left' : 'top right';
            message = _.truncate(message, {'length': 150});
            if (!type) {
                $log.warn("Method Deprecated:  Please use one of the toast.success, toast.error, toast.warning, toast.info methods");
                return $mdToast.show(
                    $mdToast
                        .simple()
                        .position(position)
                        .textContent(message)
                        .hideDelay(duration || 3000)
                );
            } else {
                return $mdToast.show(
                    $mdToast
                        .simple()
                        .position(position)
                        .textContent(message)
                        .toastClass('toast-' + type)
                        .hideDelay(duration || 3000)
                );
            }
        };

        /**
         * @description Shows the toast message for success
         * @param message
         * @param duration
         */
        self.success = function (message, duration) {
            self.show(message, 'success', duration);
        };
        /**
         * @description Shows the toast message for any error
         * @param message
         * @param duration
         */
        self.error = function (message, duration) {
            self.show(message, 'error', duration);
        };
        /**
         * @description Shows the toast message for warning
         * @param message
         * @param duration
         */
        self.warning = function (message, duration) {
            self.show(message, 'warning', duration);
        };
        /**
         * @description Shows the toast message for any info
         * @param message
         * @param duration
         */
        self.info = function (message, duration) {
            self.show(message, 'info', duration);
        };
    })
};
