module.exports = function (app) {
    app.service('g2gReturnedService', function (urlService,
                                                $http,
                                                $q,
                                                generator,
                                                G2GMessagingHistory,
                                                _,
                                                dialog,
                                                langService,
                                                errorCode,
                                                toast,
                                                cmsTemplate) {
        var self = this;
        self.serviceName = 'g2gReturnedService';

        self.g2gItems = [];

        /**
         * @description Load the g2g inbox items from server.
         * @returns {Promise|g2gItems}
         */
        self.loadG2gItems = function () {
            return $http.get(urlService.g2gInbox + 'get-returned').then(function (result) {
                self.g2gItems = generator.generateCollection(result.data.rs, G2GMessagingHistory, self._sharedMethods);
                self.g2gItems = generator.interceptReceivedCollection('G2GMessagingHistory', self.g2gItems);
                return self.g2gItems;
            }).catch(function (error) {
                return [];
            });
        };

        /**
         * @description Get g2g inbox items from self.g2gItems if found and if not load it from server again.
         * @returns {Promise|g2gItems}
         */
        self.getG2gItems = function () {
            return self.g2gItems.length ? $q.when(self.g2gItems) : self.loadG2gItems();
        };

        /**
         * @description Get g2g item by g2gItemId
         * @param g2gItemId
         * @returns {G2G|undefined} return G2G Model or undefined if not found.
         */
        self.getG2gInboxById = function (g2gItemId) {
            g2gItemId = g2gItemId instanceof G2GMessagingHistory ? g2gItemId.correspondence.id : g2gItemId;
            return _.find(self.g2gItems, function (g2gItem) {
                return Number(g2gItem.id) === Number(g2gItemId);
            });
        };

        /**
         * @description  open reason dialog
         * @param dialogTitle
         * @param $event
         * @returns {promise|*}
         */
        self.showReasonDialog = function (dialogTitle, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reason'),
                    controller: 'reasonPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    targetEvent: $event,
                    locals: {
                        title: dialogTitle
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.getUserComments()
                                .then(function (result) {
                                    return _.filter(result, 'status');
                                });
                        }
                    }
                });
        };

        self.terminateG2G = function (g2gItem,$event) {

            //  return dialog.confirmMessage(langService.get('confirm_terminate').change({name: g2gItem.getTranslatedName()}))
            return self.showReasonDialog('terminate_reason', $event)
                .then(function (reason) {
                    var isInternal = g2gItem.isInternalG2G();
                    g2gItem = generator.interceptSendInstance('G2GMessagingHistory', g2gItem);
                    return $http.put((urlService.g2gInbox + 'terminate/' + isInternal),
                        {
                            first: g2gItem,
                            second: reason
                        }).then(function (result) {
                        return result.data.rs;
                    }).catch(function (error) {
                        /*errorCode.checkIf(error, 'G2G_USER_NOT_AUTHENTICATED', function () {
                            dialog.errorMessage(langService.get('g2g_not_authenticated'));
                        });
                        errorCode.checkIf(error, 'G2G_USER_NOT_AUTHORIZED', function () {
                            dialog.errorMessage(langService.get('g2g_not_authorized'));
                        });
                        errorCode.checkIf(error, 'G2G_BOOK_PROPERTIES_CAN_NOT_BE_EMPTY', function () {
                            dialog.errorMessage(langService.get('g2g_book_properties_can_not_be_empty'));
                        });
                        errorCode.checkIf(error, 'G2G_ERROR_WHILE_TERMINATE', function () {
                            dialog.errorMessage(langService.get('g2g_error_occurred_while_terminate'));
                        });
                        errorCode.checkIf(error, 'G2G_CANNOT_REMOVE_TRANSACTION_FOR_THIS_SITE_BECAUSE_THE_STATUS_IS_NOT_REJECTED_OR_RETURNED', function () {
                            dialog.errorMessage(langService.get('g2g_can_not_terminate_because_book_not_rejected_or_returned'));
                        });*/
                        return errorCode.showErrorDialog(error);
                    });
                });
        };

        self.resendG2G = function (g2gItem) {
            var isInternal = g2gItem.isInternalG2G();
            g2gItem = generator.interceptSendInstance('G2GMessagingHistory', g2gItem);
            return $http.put((urlService.g2gInbox + 'resend/' + isInternal), g2gItem).then(function (result) {
                return result.data.rs;
            }).catch(function (error) {
                /*errorCode.checkIf(error, 'G2G_USER_NOT_AUTHENTICATED', function () {
                    dialog.errorMessage(langService.get('g2g_not_authenticated'));
                });
                errorCode.checkIf(error, 'G2G_ERROR_FETCH_SENT_OR_RETURN_BOOK', function () {
                    dialog.errorMessage(langService.get('g2g_error_fetch_sent_return_book'));
                });
                errorCode.checkIf(error, 'G2G_USER_NOT_AUTHORIZED', function () {
                    dialog.errorMessage(langService.get('g2g_not_authorized'));
                });
                errorCode.checkIf(error, 'G2G_BOOK_PROPERTIES_CAN_NOT_BE_EMPTY', function () {
                    dialog.errorMessage(langService.get('g2g_book_properties_can_not_be_empty'));
                });
                errorCode.checkIf(error, 'G2G_ERROR_WHILE_SENDING', function () {
                    dialog.errorMessage(langService.get('g2g_error_while_sending'));
                });*/
                return errorCode.showErrorDialog(error);
            });
        };

        self.openG2G = function (g2gCorrespondence) {
            // intercept send instance for G2GMessagingHistory
            //g2gCorrespondence =  g2gCorrespondence instanceof G2GMessagingHistory ? generator.interceptSendInstance('G2GMessagingHistory', g2gCorrespondence) : g2gCorrespondence;
            // get correspondence from G2G object

            return $http
                .post(urlService.g2gInbox + 'open', g2gCorrespondence)
                .then(function (result) {
                    console.log(result);
                    return result;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteG2gInbox, self.updateG2gInbox);
    });
};
