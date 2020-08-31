module.exports = function (app) {
    app.service('g2gSentItemsService', function (urlService,
                                                 $http,
                                                 $q,
                                                 generator,
                                                 G2GMessagingHistory,
                                                 _,
                                                 dialog,
                                                 langService,
                                                 toast,
                                                 cmsTemplate,
                                                 errorCode) {
        'ngInject';
        var self = this;
        self.serviceName = 'g2gSentItemsService';

        self.g2gItems = [];

        /**
         * @description Load the g2g sent items from server.
         * @param month
         * @param year
         * @returns {*}
         */
        self.loadG2gItems = function (month, year) {
            month = month.hasOwnProperty('value') ? month.value : month;
            return $http.get(urlService.g2gInbox + 'get-outbox-by-ou/year/' + year + '/month/' + month).then(function (result) {
                self.g2gItems = generator.generateCollection(result.data.rs, G2GMessagingHistory, self._sharedMethods);
                self.g2gItems = generator.interceptReceivedCollection('G2GMessagingHistory', self.g2gItems);
                return self.g2gItems;
            }).catch(function (error) {
                return [];
            });
        };

        /**
         * @description Get g2g sent items from self.g2gItems if found and if not load it from server again.
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
        self.getG2gItemsById = function (g2gItemId) {
            g2gItemId = g2gItemId instanceof G2GMessagingHistory ? g2gItemId.id : g2gItemId;
            return _.find(self.g2gItems, function (g2gItem) {
                return Number(g2gItem.id) === Number(g2gItemId);
            });
        };

        /**
         * @description Opens the dialog to select the month and year to get the data in the grid
         * @param currentMonth
         * @param currentYear
         * @param $event
         */
        self.openDateAndYearDialog = function (currentMonth, currentYear, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('select-month-year'),
                    controller: 'selectMonthYearPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        currentMonth: currentMonth,
                        currentYear: currentYear
                    }
                });
        };

        /**
         * @description  open reason dialog
         * @param dialogTitle
         * @param $event
         * @param saveButtonKey
         * @param reasonText
         * @returns {promise|*}
         */
        self.showReasonDialog = function (dialogTitle, $event, saveButtonKey, reasonText) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reason'),
                    controller: 'reasonPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    targetEvent: $event,
                    locals: {
                        title: dialogTitle,
                        saveButtonKey: saveButtonKey,
                        reasonText: reasonText || ''
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.loadUserCommentsForDistribution();
                        }
                    }
                });
        };

        /**
         * @description Recalls the g2g sent item
         * @param g2gItem
         * @param $event
         */
        self.recallG2G = function (g2gItem, $event) {
            return dialog.confirmMessage(langService.get('confirm_recall').change({name: g2gItem.getTranslatedName()}))
                .then(function () {
                    var isInternal = g2gItem.isInternalG2G();
                    g2gItem = generator.interceptSendInstance('G2GMessagingHistory', g2gItem);
                    return $http.put((urlService.g2gInbox + 'recall/' + isInternal), g2gItem).then(function (result) {
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
                        errorCode.checkIf(error, 'G2G_CANNOT_RECALL_FROM_THIS_SITE_BECAUSE_THE_STATUS_IS_NOT_PENDING_OR_SENT', function () {
                            dialog.errorMessage(langService.get('g2g_cannot_recall_because_status_is_not_pending_sent'));
                        });
                        errorCode.checkIf(error, 'G2G_ERROR_WHILE_RECALLING', function () {
                            dialog.errorMessage(langService.get('g2g_error_occurred_while_recalling'));
                        });*/
                        return errorCode.showErrorDialog(error);
                    });
                });
        };
        /**
         * @description recall and terminate.
         * @returns {*}
         * @param g2gItem
         */
        self.recallG2GTerminate = function (g2gItem) {
            var info = g2gItem.getInfo();
            return self
                .showReasonDialog(info.title)
                .then(function (comment) {
                    return $http.put(urlService.recallAndTerminate, {
                        first: g2gItem.g2gActionID,
                        second: comment
                    }).then(function (result) {
                        return result.data.rs;
                    });
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
