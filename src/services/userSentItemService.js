module.exports = function (app) {
    app.service('userSentItemService', function (urlService,
                                                 $http,
                                                 $q,
                                                 generator,
                                                 EventHistory,
                                                 toast,
                                                 langService,
                                                 cmsTemplate,
                                                 dialog,
                                                 errorCode) {
            'ngInject';
            var self = this;
            self.serviceName = 'userSentItemService';

            self.userSentItems = [];
            self.totalCount = 0;
            /**
             * @description Load the user sent items from server.
             * @returns {Promise|userSentItems}
             */
            self.loadUserSentItems = function (page, limit) {
                var offset = ((page - 1) * limit);

                return $http.get(urlService.userInboxSentItems, {
                    params: {
                        offset: offset,
                        limit: limit
                    }
                }).then(function (result) {
                    self.totalCount = result.data.count;
                    self.userSentItems = generator.generateCollection(result.data.rs, EventHistory, self._sharedMethods);
                    self.userSentItems = generator.interceptReceivedCollection('EventHistory', self.userSentItems);
                    return self.userSentItems;
                });
            };

            /**
             * @description Get user sent items from self.userSentItems if found and if not load it from server again.
             * @returns {Promise|userSentItems}
             */
            self.getUserSentItems = function (page, limit) {
                return self.userSentItems.length ? $q.when(self.userSentItems) : self.loadUserSentItems(page, limit);
            };

            /**
             * @description Contains methods for CRUD operations for user sent items
             */
            self.controllerMethod = {};

            /**
             * @description Create the shared method to the model.
             * @type {{delete: generator.delete, update: generator.update}}
             * @private
             */
            self._sharedMethods = generator.generateSharedMethods(self.deleteSentItem, self.updateSentItem);


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
            /**
             * @description open bulk reason.
             * @param dialogTitle
             * @param workItems
             * @param $event
             */
            self.showReasonBulkDialog = function (dialogTitle, workItems, $event) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('reason-bulk'),
                        controller: 'reasonBulkPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            workItems: workItems,
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
             * @description recall sent item again to user inbox.
             * @returns WorkItem status
             */
            self.recallSentItem = function (sentItem, $event, ignoreMessage) {
                return self.showReasonDialog('recall_reason', $event)
                    .then(function (reason) {
                        return $http.put((urlService.userInbox + '/' + sentItem.wfId + '/recall'), {
                            comment: reason
                        }).then(function (result) {
                            return result.data.rs;
                        }).catch(function (error) {
                            errorCode.checkIf(error, 'CANNOT_RECALL_OPENED_BOOK', function () {
                                dialog.errorMessage(langService.get('cannot_recall_opened_book'));
                            });
                            errorCode.checkIf(error, 'CANNOT_RECALL_NON_EXISTING_BOOK', function () {
                                dialog.errorMessage(langService.get('cannot_call_non_existing_book'));
                            });
                            return false;
                        });
                    });
            };

           /* /!**
             * @description Gets the information about workItem view status
             * @param workflowId
             * @returns {*}
             *!/
            self.viewWorkItem = function (workflowId) {
                return $http.get(urlService.viewWorkItem + workflowId)
                    .then(function (result) {
                        return result.data.rs;
                    }).catch(function (error) {
                        /!*errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                            dialog.errorMessage(langService.get('cannot_recall_opened_non_existing_work_item'));
                        });*!/
                        dialog.errorMessage(langService.get('cannot_recall_opened_non_existing_work_item'));
                        return false;
                    });
            };*/


        }
    );
};
