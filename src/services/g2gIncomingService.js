module.exports = function (app) {
    app.service('g2gIncomingService', function (urlService,
                                                $http,
                                                $q,
                                                generator,
                                                G2G,
                                                _,
                                                dialog,
                                                langService,
                                                toast,
                                                cmsTemplate,
                                                Incoming,
                                                errorCode) {
        'ngInject';
        var self = this;
        self.serviceName = 'g2gIncomingService';

        self.g2gItems = [];

        /**
         * @description Load the g2g inbox items from server.
         * @returns {Promise|g2gItems}
         */
        self.loadG2gItems = function () {
            return $http.get(urlService.g2gInbox + 'get-inbox-by-ou').then(function (result) {
                self.g2gItems = generator.generateCollection(result.data.rs, G2G, self._sharedMethods);
                self.g2gItems = generator.interceptReceivedCollection('G2G', self.g2gItems);
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
         * @description Get g2g inbox item by g2gItemId
         * @param g2gItemId
         * @returns {G2G|undefined} return G2gInbox Model or undefined if not found.
         */
        self.getG2gInboxById = function (g2gItemId) {
            g2gItemId = g2gItemId instanceof G2G ? g2gItemId.id : g2gItemId;
            return _.find(self.g2gItems, function (g2gItem) {
                return Number(g2gItem.id) === Number(g2gItemId);
            });
        };

        /**
         * @description  open reason dialog
         * @param dialogTitle
         * @param $event
         * @param saveButtonKey
         * @param reasonText
         * @param allowedMaxLength
         * @returns {promise|*}
         */
        self.showReasonDialog = function (dialogTitle, $event, saveButtonKey, reasonText, allowedMaxLength) {
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
                        reasonText: reasonText || '',
                        allowedMaxLength: allowedMaxLength || 200
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
         * @description Returns the document
         * @param g2gCorrespondence
         * @param $event
         * @returns {*}
         */
        self.returnG2G = function (g2gCorrespondence, $event) {
            var isInternalG2G = angular.copy(g2gCorrespondence.isInternalG2G());
            // get correspondence from G2G object
            g2gCorrespondence = g2gCorrespondence.hasOwnProperty('correspondence') ? g2gCorrespondence.correspondence : g2gCorrespondence;
            // intercept send instance for Correspondence, Incoming, ViewIncoming
            g2gCorrespondence = generator.interceptSendInstance(['Correspondence', 'Incoming', 'ViewIncoming'], g2gCorrespondence);


            return self.showReasonDialog('return_reason', $event)
                .then(function (reason) {

                    return $http
                        .put(urlService.g2gInbox + "return-to-sender/" + isInternalG2G, {
                            first: g2gCorrespondence,
                            second: reason
                        })
                        .then(function (result) {
                            return true;
                        })
                        .catch(function (error) {
                            /*errorCode.checkIf(error, 'G2G_USER_NOT_AUTHENTICATED', function () {
                                dialog.errorMessage(langService.get('g2g_not_authenticated'));
                            });
                            errorCode.checkIf(error, 'G2G_USER_NOT_AUTHORIZED', function () {
                                dialog.errorMessage(langService.get('g2g_not_authorized'));
                            });
                            errorCode.checkIf(error, 'G2G_BOOK_PROPERTIES_CAN_NOT_BE_EMPTY', function () {
                                dialog.errorMessage(langService.get('g2g_book_properties_can_not_be_empty'));
                            });
                            errorCode.checkIf(error, 'G2G_ERROR_WHILE_RETURNING_TO_SENDER', function () {
                                dialog.errorMessage(langService.get('g2g_error_while_returning_to_sender'));
                            });*/

                            if (errorCode.checkIf(error, 'G2G_CANT_RETURN_AS_ALREADY_RECEIVED') === true) {
                                dialog.errorMessage(generator.getTranslatedError(error));
                                return $q.reject(error);
                            } else {
                                return errorCode.showErrorDialog(error);
                            }
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
