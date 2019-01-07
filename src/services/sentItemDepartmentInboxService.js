module.exports = function (app) {
    app.service('sentItemDepartmentInboxService', function (urlService,
                                                            $http,
                                                            $q,
                                                            generator,
                                                            SentItemDepartmentInbox,
                                                            _,
                                                            dialog,
                                                            langService,
                                                            toast,
                                                            cmsTemplate,
                                                            errorCode,
                                                            userCommentService,
                                                            tokenService,
                                                            $timeout) {
        'ngInject';
        var self = this;
        self.serviceName = 'sentItemDepartmentInboxService';

        self.sentItemDepartmentInboxes = [];

        /**
         * @description Load the sent items from server.
         * @returns {Promise|sentItemDepartmentInboxes}
         */
        self.loadSentItemDepartmentInboxes = function (month, year, centralArchive) {
            /*
            * Pending(0),Sent(1),Delivered(2),Returned(3),Removed(4)
            * */
            month = month.hasOwnProperty('value') ? month.value : month;
            return $http.post(urlService.departmentInboxes + '/dept-sent-items/month/' + month + '/year/' + year, [0, 1, 2, 3], {
                params: {
                    'is-central': !!centralArchive
                }
            }).then(function (result) {
                self.sentItemDepartmentInboxes = generator.generateCollection(result.data.rs, SentItemDepartmentInbox, self._sharedMethods);
                self.sentItemDepartmentInboxes = generator.interceptReceivedCollection('SentItemDepartmentInbox', self.sentItemDepartmentInboxes);
                return self.sentItemDepartmentInboxes;
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
         * @description open bulk reason.
         * @param dialogTitle
         * @param workItems
         * @param $event
         */
        self.showReasonBulkDialog = function (dialogTitle, workItems, $event) {
            return dialog
                .showDialog({
                    template: cmsTemplate.getPopup('reason-bulk'),
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
         * @description get workitem by vsid from server.
         * @returns {wobNumber}
         */
        self.fetchDeptSentWorkitemByVsId = function (vsid) {
            return $http.get(urlService.departmentInboxes + '/dept-sent-workitem-by-vsid/' + vsid).then(function (result) {
                return result.data.rs;
            });
        };

        /**
         * @description recall single WorkItem again to user inbox.
         * @returns WorkItem status
         */

        /*self.recallSingleWorkItem = function (wobNumber,user,comment) {
            return $http
                .put((urlService.userInbox + '/' + wobNumber + '/reassign'), {
                    user: user,
                    comment: comment
                })
                .then(function (result) {
                    return result.data.rs;
                });
        };*/

        /**
         * @description recall sent item again to user inbox.
         * @returns WorkItem status
         */
        self.recallSentItem = function (sentItem, $event, ignoreMessage) {
            return self.showReasonDialog('recall_reason', $event)
                .then(function (reason) {
                    return $http.put((urlService.departmentInboxes + '/' + sentItem.getInfo().vsId + '/recall'), {
                        comment: reason
                    }).then(function (result) {
                        return result.data.rs;
                    }).catch(function (error) {
                        errorCode.checkIf(error, 'CANNOT_RECALL_OPENED_BOOK', function () {
                            dialog.errorMessage(langService.get('cannot_recall_received_book'));
                        });
                        errorCode.checkIf(error, 'CANNOT_RECALL_NON_EXISTING_BOOK', function () {
                            dialog.errorMessage(langService.get('cannot_call_non_existing_book'));
                        });
                        return false;
                    });
                });
        };


        /**
         * @description Get sent items from self.sentItemDepartmentInboxes if found and if not load it from server again.
         * @returns {Promise|sentItemDepartmentInboxes}
         */
        self.getSentItemDepartmentInboxes = function (month, year) {
            return self.sentItemDepartmentInboxes.length ? $q.when(self.sentItemDepartmentInboxes) : self.loadSentItemDepartmentInboxes(month, year);
        };

        /**
         * @description Contains methods for CRUD operations for sent items
         */
        self.controllerMethod = {
            /**
             * @description Opens the dialog to select the month and year to get the data in the grid
             * @param currentMonth
             * @param currentYear
             * @param $event
             */
            openDateAndYearDialog: function (currentMonth, currentYear, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('select-month-year'),
                        controller: 'selectMonthYearPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            currentMonth: currentMonth,
                            currentYear: currentYear
                        }
                    });
            },
            /**
             * @description Terminate user inbox
             * @param sentItemDepartmentInbox
             * @param $event
             */
            sentItemDepartmentInboxTerminate: function (sentItemDepartmentInbox, $event) {
                return self.terminateSentItemDepartmentInbox(sentItemDepartmentInbox)
                    .then(function (result) {
                        return true;
                    })
            }
        };

        /**
         * @description Terminate user inbox item
         * @param {WorkItem} sentItemDepartmentInbox
         */
        self.terminateSentItemDepartmentInbox = function (sentItemDepartmentInbox) {
            var won = sentItemDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (sentItemDepartmentInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? sentItemDepartmentInbox.generalStepElm.workObjectNumber : sentItemDepartmentInbox.generalStepElm)
                : (sentItemDepartmentInbox.hasOwnProperty('workObjectNumber') ? sentItemDepartmentInbox.workObjectNumber : sentItemDepartmentInbox);
            /* var wfName = sentItemDepartmentInbox.hasOwnProperty('generalStepElm')
                 ? (sentItemDepartmentInbox.generalStepElm.hasOwnProperty('workFlowName') ? sentItemDepartmentInbox.generalStepElm.workFlowName : sentItemDepartmentInbox.generalStepElm)
                 : (sentItemDepartmentInbox.hasOwnProperty('workFlowName') ? sentItemDepartmentInbox.workFlowName : sentItemDepartmentInbox);*/

            var wfName = "outgoing";

            return $http
                .put(urlService.userInboxActions + "/" + wfName.toLowerCase() + "/terminate/" + won)
                .then(function (result) {
                    return sentItemDepartmentInbox;
                });
        };

        /**
         * @description Get sent item by sentItemDepartmentInboxId
         * @param sentItemDepartmentInboxId
         * @returns {SentItemDepartmentInbox|undefined} return SentItemDepartmentInbox Model or undefined if not found.
         */
        self.getSentItemDepartmentInboxById = function (sentItemDepartmentInboxId) {
            sentItemDepartmentInboxId = sentItemDepartmentInboxId instanceof SentItemDepartmentInbox ? sentItemDepartmentInboxId.id : sentItemDepartmentInboxId;
            return _.find(self.sentItemDepartmentInboxes, function (sentItemDepartmentInbox) {
                return Number(sentItemDepartmentInbox.id) === Number(sentItemDepartmentInboxId);
            });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param sentItemDepartmentInbox
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateSentItemDepartmentInbox = function (sentItemDepartmentInbox, editMode) {
            var sentItemDepartmentInboxesToFilter = self.sentItemDepartmentInboxes;
            if (editMode) {
                sentItemDepartmentInboxesToFilter = _.filter(sentItemDepartmentInboxesToFilter, function (sentItemDepartmentInboxToFilter) {
                    return sentItemDepartmentInboxToFilter.id !== sentItemDepartmentInbox.id;
                });
            }
            return _.some(_.map(sentItemDepartmentInboxesToFilter, function (existingSentItemDepartmentInbox) {
                return existingSentItemDepartmentInbox.arName === sentItemDepartmentInbox.arName
                    || existingSentItemDepartmentInbox.enName.toLowerCase() === sentItemDepartmentInbox.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSentItemDepartmentInbox, self.updateSentItemDepartmentInbox);
    });
};
