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
                                                errorCode,
                                                $sce) {
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
         * @returns {promise|*}
         */
        self.showReasonDialog = function (dialogTitle, $event) {
            return dialog
                .showDialog({
                    template: cmsTemplate.getPopup('reason'),
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

        /**
         * @description Returns the document
         * @param g2gCorrespondence
         * @param $event
         * @returns {*}
         */
        self.returnG2G = function (g2gCorrespondence, $event) {
            // intercept send instance for Correspondence, Incoming, ViewIncoming
            g2gCorrespondence = generator.interceptSendInstance(['Correspondence', 'Incoming', 'ViewIncoming'], g2gCorrespondence);
            // get correspondence from G2G object
            g2gCorrespondence = g2gCorrespondence.hasOwnProperty('correspondence') ? g2gCorrespondence.correspondence : g2gCorrespondence;

            return self.showReasonDialog('return_reason', $event)
                .then(function (reason) {

                    return $http
                        .put(urlService.g2gInbox + "return-to-sender", {
                            properties: g2gCorrespondence,
                            comment: reason
                        })
                        .then(function (result) {
                            return true;
                        })
                        .catch(function (error) {
                            errorCode.checkIf(error, 'G2G_ERROR_WHILE_RETURNING_TO_SENDER', function () {
                                dialog.errorMessage(langService.get('g2g_error_while_returning_to_sender'));
                            });
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
