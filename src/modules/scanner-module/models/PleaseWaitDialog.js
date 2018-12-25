module.exports = function (app) {
    app.factory('PleaseWaitDialog', function (dialog, $timeout, cmsTemplate) {
        'ngInject';
        var self = this;
        self.waiting = false;
        /**
         * to show scanner please wait dialog
         * @param showValue
         * @param scanning
         * @param buttonCallback
         * @param CCToolkit
         * @param message
         */
        self.show = function (showValue, scanning, buttonCallback, CCToolkit, message) {
            if (showValue) {
                self.waiting = true;
                dialog
                    .showDialog({
                        template: require('./../templates/please-wait.html'),
                        locals: {
                            scanning: scanning,
                            buttonCallback: buttonCallback || false,
                            CCToolkit: CCToolkit || false,
                            message: message || false
                        },
                        controller: function (dialog) {
                            'ngInject';
                            this.cancelOperation = function () {
                                dialog.cancel();
                            }
                        },
                        controllerAs: 'ctrl',
                        bindToController: true
                    });
            } else {
                if (self.waiting) {
                    $timeout(function () {
                        dialog.hide();
                        self.waiting = false;
                    }, 200);
                }
            }

        };
        return self;
    });
};
