module.exports = function (app) {
    app.controller('subscriptionPopCtrl', function (dialog,
                                                             eventTypes) {
        'ngInject';
        var self = this;
        self.controllerName = 'subscriptionPopCtrl';
        //self.eventType = '';
        self.eventTypes = eventTypes;
        self.selectedEventType = null;

        /**
         * @description to set Event Type when user select it from menu.
         */
        /*self.setEventType = function () {
            self.eventType = self.selectedEventType.lookupKey;
        };*/
        /**
         * @description send the reason for controller.
         */
        self.sendEventType = function () {
            dialog.hide(self.selectedEventType);
        };

        /**
         * @description close reason reason.
         */
        self.closeEventTypePopup = function () {
            dialog.cancel();
        };
    });
};