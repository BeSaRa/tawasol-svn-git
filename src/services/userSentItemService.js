module.exports = function (app) {
    app.service('userSentItemService', function (urlService,
                                                 $http,
                                                 $q,
                                                 _,
                                                 generator,
                                                 EventHistory,
                                                 toast,
                                                 langService,
                                                 gridService,
                                                 cmsTemplate,
                                                 dialog,
                                                 errorCode,
                                                 EventHistoryCriteria) {
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
             * @description Filters the user sent items from server side according the passed criteria by user
             * @param searchText
             * @param searchCriteria
             * @param page
             * @param selectedEmployee for followup sent items
             * @param selectedOrganization for followup sent items
             * @returns {*}
             */
            self.filterUserSentItems = function (searchText, searchCriteria, page, selectedEmployee, selectedOrganization) {
                var gridLimit = gridService.getGridPagingLimitByGridName(gridService.grids.inbox.sentItem) || 5;
                page = page ? page : 1;
                var offset = ((page - 1) * gridLimit);

                if (searchText && !searchCriteria) {
                    searchCriteria = new EventHistoryCriteria({
                        docSubject: searchText
                    });
                }
                //userId and ouId used when followup sent items
                var userId = (selectedEmployee && selectedEmployee.hasOwnProperty('id')) ? selectedEmployee.id : selectedEmployee;
                var ouId = (selectedOrganization && selectedOrganization.hasOwnProperty('id')) ? selectedOrganization.id : selectedOrganization;

                return $http.post(((userId && ouId) ?
                    urlService.followupEmployeeSentItems.change({
                        userId: userId,
                        ouId: ouId
                    }) : urlService.userInboxSentItems) + "?limit=" + gridLimit + "&offset=" + offset,
                    generator.interceptSendInstance('EventHistoryCriteria', searchCriteria))
                    .then(function (result) {
                        // don't update the original records or total count when searching as it is used in controller
                        var userSentItems = generator.generateCollection(result.data.rs, EventHistory, self._sharedMethods);
                        userSentItems = generator.interceptReceivedCollection('EventHistory', userSentItems);
                        return {
                            records: userSentItems,
                            count: result.data.count
                        };
                    })
                    .catch(function (error) {
                        toast.error(langService.get('something_went_wrong_while_processing'));
                        return $q.reject('serverError');
                    });
            };

            self.controllerMethod = {
                openFilterDialog: function (grid, searchCriteria, selectedEmployee, selectedOrganization) {
                    return dialog
                        .showDialog({
                            templateUrl: cmsTemplate.getPopup('user-sent-items-filter'),
                            controller: 'userSentItemFilterPopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                searchCriteria: searchCriteria,
                                grid: grid,
                                selectedEmployee: selectedEmployee ? selectedEmployee : null,
                                selectedOrganization: selectedOrganization ? selectedOrganization : null
                            },
                            resolve: {
                                workflowActions: function (workflowActionService) {
                                    'ngInject';
                                    return workflowActionService.loadCurrentUserWorkflowActions();
                                },
                                documentStatuses: function (documentStatusService) {
                                    'ngInject';
                                    return documentStatusService.getDocumentStatuses();
                                },
                                correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                                    'ngInject';
                                    return correspondenceSiteTypeService.getCorrespondenceSiteTypes();
                                },
                                usersTo: function (ouApplicationUserService, employeeService) {
                                    'ngInject';
                                    return ouApplicationUserService.searchByCriteria({regOu: employeeService.getEmployee().getRegistryOUID()})
                                        .then(function (result) {
                                            return _.uniqBy(_.map(result, 'applicationUser'), 'domainName');
                                        });
                                }
                            }
                        });
                }
            };

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
             * @description open bulk reason.
             * @param dialogTitle
             * @param workItems
             * @param $event
             * @param allowedMaxLength
             */
            self.showReasonBulkDialog = function (dialogTitle, workItems, $event, allowedMaxLength) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('reason-bulk'),
                        controller: 'reasonBulkPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            workItems: workItems,
                            title: dialogTitle,
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
             * @description recall sent item again to user inbox.
             * @returns WorkItem status
             */
            self.recallSentItem = function (sentItem, $event, ignoreMessage) {
                var wfId = sentItem.wfId;
                return self.showReasonDialog('recall_reason', $event)
                    .then(function (reason) {
                        return $http.put((urlService.userInbox + '/' + wfId + '/recall'), {
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
                            errorCode.checkIf(error, 'SEQ_WF_RECALL_WF', function () {
                                dialog.errorMessage(generator.getTranslatedError(error));
                            });
                            errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                                dialog.errorMessage(langService.get('cannot_call_non_existing_book'));
                            });
                            return false;
                        });
                    });
            };


            /**
             * @description recall multiple sent items again to user inbox.
             */
            self.recallMultipleSentItem = function (sentItems, $event, ignoreMessage) {
                return self.showReasonDialog('recall_reason', $event)
                    .then(function (reason) {
                        var items = _.map(sentItems, function (sentItem) {
                            return {
                                wobNum: sentItem.wfId,
                                comment: reason
                            }
                        });
                        return $http.put(urlService.bulkRecallSentItems, items).then(function (result) {
                            return _bulkMessages(result, sentItems, ignoreMessage, 'failed_recall_selected', 'selected_recall_success', 'following_records_failed_to_recall');
                        }).catch(function (error) {
                            console.log('error recall', error);
                        });
                    })
            }

            /**
             * @description bulk message for any bulk actions.
             * @param result
             * @param collection
             * @param ignoreMessage
             * @param errorMessage
             * @param successMessage
             * @param failureSomeMessage
             * @returns {*}
             * @private
             */
            function _bulkMessages(result, collection, ignoreMessage, errorMessage, successMessage, failureSomeMessage) {
                var failureCollection = [];
                var currentIndex = 0;
                _.map(result.data.rs, function (value) {
                    if (!value)
                        failureCollection.push(collection[currentIndex]);
                    currentIndex++;
                });
                if (!ignoreMessage) {
                    if (failureCollection.length === collection.length) {
                        toast.error(langService.get(errorMessage));
                    } else if (failureCollection.length) {
                        generator.generateFailedBulkActionRecords(failureSomeMessage, _.map(failureCollection, function (item) {
                            return item.getTranslatedName();
                        }));
                    } else {
                        toast.success(langService.get(successMessage));
                    }
                }
                return collection;
            }

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
