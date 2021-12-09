module.exports = function (app) {
    app.service('g2gReturnedService', function (urlService,
                                                $http,
                                                $q,
                                                generator,
                                                configurationService,
                                                G2GMessagingHistory,
                                                _,
                                                dialog,
                                                langService,
                                                errorCode,
                                                toast,
                                                cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'g2gReturnedService';

        self.g2gItems = [];
        self.g2gReturnedAfterReturnItems = [];

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
         * @description g2g returned after return
         * @returns {*}
         */
        self.loadG2gReturnedAfterReturn = function (month, year) {
            month = month.hasOwnProperty('value') ? month.value : month;
            return $http.get(urlService.g2gInbox + 'get-returned-by-ou/year/' + year + '/month/' + month)
                .then(function (result) {
                    self.g2gReturnedAfterReturnItems = generator.generateCollection(result.data.rs, G2GMessagingHistory, self._sharedMethods);
                    self.g2gReturnedAfterReturnItems = generator.interceptReceivedCollection('G2GMessagingHistory', self.g2gReturnedAfterReturnItems);
                    return self.g2gReturnedAfterReturnItems;
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

        self.terminateG2G = function (g2gItem, $event) {
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
                        return errorCode.showErrorDialog(error);
                    });
                });
        };

        self.terminateG2GKuwait = function (g2gItem, $event) {
            return $http.get(urlService.g2gTerminateByActionID.replace('{g2gActionID}', g2gItem.hasOwnProperty('g2gActionID') ? g2gItem.g2gActionID : g2gItem.correspondence.g2gActionID)).then(function (result) {
                return result.data.rs;
            }).catch(function (error) {
                return errorCode.showErrorDialog(error);
            });
        };

        self.resendG2G = function (g2gItem) {
            var isInternal = g2gItem.isInternalG2G();
            g2gItem = generator.interceptSendInstance('G2GMessagingHistory', g2gItem);
            return $http.put((urlService.g2gInbox + 'resend/' + isInternal), g2gItem).then(function (result) {
                return result.data.rs;
            }).catch(function (error) {
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
                  //  console.log(result);
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
