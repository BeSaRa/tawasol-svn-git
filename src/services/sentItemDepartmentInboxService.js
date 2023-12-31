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
                                                            errorCode) {
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
            return $http.post(urlService.departmentInboxes + '/dept-sent-items/month/' + month + '/year/' + year, [0, 1, 2], {
                params: {
                    'is-central': !!centralArchive
                }
            }).then(function (result) {
                self.sentItemDepartmentInboxes = generator.generateCollection(result.data.rs, SentItemDepartmentInbox, self._sharedMethods);
                self.sentItemDepartmentInboxes = generator.interceptReceivedCollection('SentItemDepartmentInbox', self.sentItemDepartmentInboxes);
                return self.sentItemDepartmentInboxes;
            });
        };

        self.loadCombinedSentItemDepartmentInboxes = function (month, year) {
            /*
          * Pending(0),Sent(1),Delivered(2),Returned(3),Removed(4)
          * */
            month = month.hasOwnProperty('value') ? month.value : month;
            return $http.post(urlService.departmentInboxes + '/hierarchical/dept-sent-items/month/' + month + '/year/' + year, [0, 1, 2]
            ).then(function (result) {
                var records = [];
                self.sentItemDepartmentInboxes = [];
                Object.keys(result.data.rs)
                    .forEach((key) => {
                        // var sentItems =result[key] ;
                        records = generator.generateCollection(result.data.rs[key], SentItemDepartmentInbox, self._sharedMethods);
                        records = generator.interceptReceivedCollection('SentItemDepartmentInbox', records);
                        records[0].combinedItems = (records.length > 1) ? records : [];
                        self.sentItemDepartmentInboxes.push(records[0]);
                    });

                return _.orderBy(self.sentItemDepartmentInboxes, 'sentDateTimeStamp', 'desc');
            });
        }


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
                    return $http.put((urlService.departmentInboxes + '/recall'), {
                        comment: reason,
                        vsId: sentItem.getInfo().vsId,
                        subSiteId: sentItem.subSiteToId
                    }).then(function (result) {
                        return result.data.rs;
                    }).catch(function (error) {
                        errorCode.checkIf(error, 'CANNOT_RECALL_OPENED_BOOK', function () {
                            dialog.errorMessage(langService.get('cannot_recall_received_book'));
                        });
                        errorCode.checkIf(error, 'CANNOT_RECALL_NON_EXISTING_BOOK', function () {
                            dialog.errorMessage(langService.get('cannot_call_non_existing_book'));
                        });
                        errorCode.checkIf(error, 'SEQ_WF_RECALL_WF', function () {
                            dialog.errorMessage(langService.get('error_recall_book'));
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
                        templateUrl: cmsTemplate.getPopup('select-month-year'),
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
         * @description show combined sent items
         * @returns {*}
         * @param departmentSentItem
         * @param selectedYear
         * @param selectedMonth
         * @param $event
         */
        self.showCombinedSentItems = function (departmentSentItem, selectedYear, selectedMonth, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('department-inbox-sent-items'),
                    controller: 'sentItemDepartmentInboxPopupCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    targetEvent: $event,
                    locals: {
                        departmentSentItem: departmentSentItem,
                        selectedYear: selectedYear,
                        selectedMonth: selectedMonth
                    }
                });
        }

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
