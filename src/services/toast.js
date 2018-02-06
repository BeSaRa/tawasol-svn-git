module.exports = function (app) {
    app.service('toast', function (langService,
                                   $mdToast,
                                   $log) {
        'ngInject';
        var self = this;

        /**
         * @description Shows the toast message according to the type passed to it. Type will make toast to identify success, error, warning, info
         * @param message
         * @param type
         * @param delay
         * @returns {promise}
         */
        self.show = function (message, type, delay) {
            var position = langService.current === 'ar' ? 'top left' : 'top right';
            if (!type) {
                $log.warn("Method Deprecated:  Please use one of the toast.success, toast.error, toast.warning, toast.info methods");
                return $mdToast.show(
                    $mdToast
                        .simple()
                        .position(position)
                        .textContent(message)
                        .hideDelay(delay || 3000)
                );
            }
            else {
                return $mdToast.show(
                    $mdToast
                        .simple()
                        .position(position)
                        .textContent(message)
                        .toastClass('toast-' + type)
                        .hideDelay(delay || 3000)
                );
            }
        };

        /**
         * @description Shows the toast message for success
         * @param message
         * @param delay
         */
        self.success = function (message, delay) {
            self.show(message, 'success', delay);
        };
        /**
         * @description Shows the toast message for any error
         * @param message
         * @param delay
         */
        self.error = function (message, delay) {
            self.show(message, 'error', delay);
        };
        /**
         * @description Shows the toast message for warning
         * @param message
         * @param delay
         */
        self.warning = function (message, delay) {
            self.show(message, 'warning', delay);
        };
        /**
         * @description Shows the toast message for any info
         * @param message
         * @param delay
         */
        self.info = function (message, delay) {
            self.show(message, 'info', delay);
        };
    })
};