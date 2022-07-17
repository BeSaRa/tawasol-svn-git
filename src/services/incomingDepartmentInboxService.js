module.exports = function (app) {
    app.service('incomingDepartmentInboxService', function (urlService,
                                                            $http,
                                                            $q,
                                                            generator,
                                                            WorkItem,
                                                            _,
                                                            dialog,
                                                            langService,
                                                            toast,
                                                            cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'incomingDepartmentInboxService';

        self.incomingDepartmentInboxes = [];
        self.totalCount = 0;

        /**
         * @description Load the incoming department inbox items from server.
         * @param ignoreTokenRefresh
         * @param page
         * @param limit
         * @param criteria
         * @returns {Promise|incomingDepartmentInboxes}
         */
        self.loadIncomingDepartmentInboxes = function (ignoreTokenRefresh, page, limit, criteria) {
            var offset = ((page - 1) * limit);
            var params = {offset: offset, limit: limit};
            if (criteria) {
                params.criteria = criteria;
            }
            if (ignoreTokenRefresh) {
                params.ignoreTokenRefresh = true;
            }
            return $http.get(urlService.departmentInboxes + "/all-mails", {
                params: params
            }).then(function (result) {
                self.totalCount = result.data.count;
                self.incomingDepartmentInboxes = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                self.incomingDepartmentInboxes = generator.interceptReceivedCollection('WorkItem', self.incomingDepartmentInboxes);
                return self.incomingDepartmentInboxes;
            });
        };

        /**
         * @description Get incoming department inbox items from self.incomingDepartmentInboxes if found and if not load it from server again.
         * @returns {Promise|incomingDepartmentInboxes}
         */
        self.getIncomingDepartmentInboxes = function (ignoreTokenRefresh, page, limit, criteria) {
            return self.incomingDepartmentInboxes.length ? $q.when(self.incomingDepartmentInboxes) : self.loadIncomingDepartmentInboxes(ignoreTokenRefresh, page, limit, criteria);
        };

        /**
         * @description Contains methods for CRUD operations for incoming department inbox items
         */
        self.controllerMethod = {
            incomingDepartmentInboxReturn: function (incomingDepartmentInbox, $event) {
                return self.returnIncomingDepartmentInbox(incomingDepartmentInbox)
                    .then(function (result) {
                        toast.success(langService.get("return_specific_success").change({name: incomingDepartmentInbox.getNames()}));
                        return true;
                    });
            },
            /**
             * @description Return bulk returned department incoming items
             * @param incomingDepartmentInboxes
             * @param $event
             */
            incomingDepartmentInboxesReturnBulk: function (incomingDepartmentInboxes, $event) {
                return self.returnBulkIncomingDepartmentInboxes(incomingDepartmentInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === incomingDepartmentInboxes.length) {
                            toast.error(langService.get("failed_return_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('return_success_except_following', _.map(result, function (returnedDepartmentInbox) {
                                return returnedDepartmentInbox.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_return_success"));
                            response = true;
                        }
                        return response;
                    });
            },
            incomingDepartmentInboxReceive: function (incomingDepartmentInbox, $event) {
                return self.receiveIncomingDepartmentInbox(incomingDepartmentInbox)
                    .then(function (result) {
                        toast.success(langService.get("receive_specific_success").change({name: incomingDepartmentInbox.getNames()}));
                        return true;
                    });
            },
            incomingDepartmentInboxQuickReceive: function (incomingDepartmentInbox, $event) {
                return self.quickReceiveIncomingDepartmentInbox(incomingDepartmentInbox)
                    .then(function (result) {
                        toast.success(langService.get("quick_receive_specific_success").change({name: incomingDepartmentInbox.getNames()}));
                        return result.data.rs;
                    });
            },
            /**
             * @description Terminate incoming department document
             * @param incomingDepartmentInbox
             * @param $event
             * @param justReason
             */
            incomingDepartmentInboxTerminate: function (incomingDepartmentInbox, $event, justReason) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('reason'),
                        controller: 'reasonPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            justReason: justReason
                        },
                        resolve: {
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            }
                        }
                    }).then(function (reason) {
                        // to check if you need to return just the reason and no operation.
                        if (justReason)
                            return reason;

                        return self.terminateIncomingDepartmentInbox(incomingDepartmentInbox, reason)
                            .then(function () {
                                return true;
                            })
                    });
            },
            /**
             * @description Terminate bulk incoming department items
             * @param workItems
             * @param $event
             * @param ignoreMessage
             */
            incomingDepartmentInboxTerminateBulk: function (workItems, $event, ignoreMessage) {
                // if the selected workItem has just one record.
                if (workItems.length === 1)
                    return self.controllerMethod.incomingDepartmentInboxTerminate(workItems[0]);

                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('reason-bulk'),
                        controller: 'reasonBulkPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            workItems: workItems
                        },
                        resolve: {
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            }
                        }
                    })
                    .then(function (workItems) {
                        return self.terminateBulkIncomingDepartmentInbox(workItems, $event, ignoreMessage)
                            .then(function (result) {
                                var response = false;
                                if (result.length === workItems.length) {
                                    toast.error(langService.get("failed_terminate_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('following_records_failed_to_terminate', _.map(result, function (readyToExport) {
                                        return readyToExport.getTranslatedName();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("selected_terminate_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            },
        };


        /**
         * @description Get incoming department inbox item by incomingDepartmentInboxId
         * @param incomingDepartmentInboxId
         * @returns {IncomingDepartmentInbox|undefined} return IncomingDepartmentInbox Model or undefined if not found.
         */
        self.getIncomingDepartmentInboxById = function (incomingDepartmentInboxId) {
            incomingDepartmentInboxId = incomingDepartmentInboxId instanceof IncomingDepartmentInbox ? incomingDepartmentInboxId.id : incomingDepartmentInboxId;
            return _.find(self.incomingDepartmentInboxes, function (incomingDepartmentInbox) {
                return Number(incomingDepartmentInbox.id) === Number(incomingDepartmentInboxId);
            });
        };


        /**
         * @description Return grid action
         * @param incomingDepartmentInbox
         */
        self.returnIncomingDepartmentInbox = function (incomingDepartmentInbox) {
            var vsId = incomingDepartmentInbox.generalStepElm.vsId;
            var workObjectNumber = incomingDepartmentInbox.generalStepElm.workObjectNumber;
            return $http
                .put(urlService.departmentInboxes + '/' + vsId + '/return/' + workObjectNumber)
                .then(function (result) {
                    return result;
                });
        };

        /**
         * @description Return bulk incoming department inbox items
         * @param incomingDepartmentInboxes
         */
        self.returnBulkIncomingDepartmentInboxes = function (incomingDepartmentInboxes) {
            /*var pairToReturn = _.map(incomingDepartmentInboxes, function (incomingDepartmentInbox) {
                return {
                    first: incomingDepartmentInbox.hasOwnProperty('generalStepElm')
                        ? (incomingDepartmentInbox.generalStepElm.hasOwnProperty('vsId') ? incomingDepartmentInbox.generalStepElm.vsId : incomingDepartmentInbox.generalStepElm) : (incomingDepartmentInbox.hasOwnProperty('vsId') ? incomingDepartmentInbox.vsId : incomingDepartmentInbox),
                    second: incomingDepartmentInbox.hasOwnProperty('generalStepElm')
                        ? (incomingDepartmentInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? incomingDepartmentInbox.generalStepElm.workObjectNumber : incomingDepartmentInbox.generalStepElm)
                        : (incomingDepartmentInbox.hasOwnProperty('workObjectNumber') ? incomingDepartmentInbox.workObjectNumber : incomingDepartmentInbox),

                }
            });*/
            var pairToReturn = _.map(incomingDepartmentInboxes, function (incomingDepartmentInbox) {
                var info = incomingDepartmentInbox.getInfo();
                return {
                    first: info.vsId,
                    second: info.wobNumber
                }
            });
            return $http
                .put(urlService.departmentInboxes + '/return/bulk', pairToReturn)
                .then(function (result) {
                    result = result.data.rs;
                    var failedIncomingDepartmentInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedIncomingDepartmentInboxes.push(key);
                    });
                    return _.filter(pairToReturn, function (pair) {
                        return (failedIncomingDepartmentInboxes.indexOf(pair.second) > -1);
                    });
                });
        };

        /**
         * @description Receive grid action
         * @param incomingDepartmentInbox
         */
        self.receiveIncomingDepartmentInbox = function (incomingDepartmentInbox) {
            //var vsId = incomingDepartmentInbox.generalStepElm.vsId;
            var workObjectNumber = incomingDepartmentInbox.generalStepElm.workObjectNumber;
            return $http
                .put(urlService.departmentInboxes + '/' + workObjectNumber + '/receive')
                .then(function (result) {
                    return result;
                });
        };


        /**
         * @description quick receive grid action
         * @param incomingDepartmentInbox
         */
        self.quickReceiveIncomingDepartmentInbox = function (incomingDepartmentInbox) {
            var workObjectNumber = incomingDepartmentInbox.generalStepElm.workObjectNumber;
            return $http
                .put((urlService.departmentInboxes + '/' + workObjectNumber + '/' + 'receive-quick'))
                .then(function (result) {
                    return result;
                });
        };

        /**
         * @description Terminate incoming department item
         * @param incomingDepartmentInbox
         * @param reason
         */
        self.terminateIncomingDepartmentInbox = function (incomingDepartmentInbox, reason) {
            var info = incomingDepartmentInbox.getInfo();
            return $http
                .put(urlService.userInboxActions + "/" + info.documentClass + "/terminate/wob-num", {
                    first: info.wobNumber,
                    second: reason
                })
                .then(function (result) {
                    let res = result.data.rs;
                    if (!res) {
                        throw new Error(res);
                    }
                    return incomingDepartmentInbox;
                }).catch(function (error) {
                    toast.error(langService.get('failed_exporting'));
                    return $q.reject(error)
                });
        };

        /**
         * @description Terminate bulk Ready To Export items
         * @param workItems
         * @param $event
         * @param ignoreMessage
         */
        self.terminateBulkIncomingDepartmentInbox = function (workItems, $event, ignoreMessage) {
            var items = _.map(workItems, function (workItem) {
                return {
                    first: workItem.getWobNumber(),
                    second: workItem.reason
                };
            });
            var wfName = 'incoming';

            return $http
                .put((urlService.userInboxActions + "/" + wfName.toLowerCase() + "/terminate/bulk"), items)
                .then(function (result) {
                    result = result.data.rs;
                    var failedIncomingDepartmentItems = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedIncomingDepartmentItems.push(key);
                    });
                    return _.filter(workItems, function (workItem) {
                        return (failedIncomingDepartmentItems.indexOf(workItem.generalStepElm.workObjectNumber) > -1);
                    });
                });
        };


        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteIncomingDepartmentInbox, self.updateIncomingDepartmentInbox);
    });
};
