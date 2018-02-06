module.exports = function (app) {
    app.controller('viewDocumentInboxDirectiveCtrl', function ($scope,
                                                               LangWatcher,
                                                               lookupService,
                                                               $q,
                                                               langService,
                                                               toast,
                                                               dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'viewDocumentInboxDirectiveCtrl';
        self.outgoing = null;
        //self.document = null;
        self.buttonsToShow = null;

        LangWatcher($scope); // to watch the languages

        /**
         * @description process callback of buttons without params
         * @param callbackMethod
         * @param model
         * @param $event
         */
        self.processButtonsCallback = function (callbackMethod, model, $event) {
            callbackMethod(model, $event);
        };

        /**
         * @description process callback of buttons with params
         * @param callbackMethod
         * @param model
         * @param params
         * @param $event
         */
        self.processButtonsCallbackWithParams = function (callbackMethod, model, params, $event) {
            callbackMethod(model, params, $event);
        };

    });
};