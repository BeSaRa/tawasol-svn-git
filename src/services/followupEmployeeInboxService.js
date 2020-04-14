module.exports = function (app) {
    app.service('followupEmployeeInboxService', function (urlService,
                                                          $http,
                                                          $q,
                                                          $timeout,
                                                          loadingIndicatorService,
                                                          generator,
                                                          WorkItem,
                                                          tokenService,
                                                          _,
                                                          dialog,
                                                          langService,
                                                          toast,
                                                          cmsTemplate,
                                                          EventHistory,
                                                          employeeService) {
        'ngInject';
        var self = this;
        self.serviceName = 'followupEmployeeInboxService';

        self.followupEmployeeInboxes = [];
        self.followupEmployeeSentItems = [];
        self.followupSentItemsTotalCount = 0;

        self.currentUser = employeeService.getEmployee();

        /**
         * @description Load the followup employee inboxes from server.
         * @returns {Promise|followupEmployeeInboxes}
         */
        self.loadFollowupEmployeeInboxes = function (employee, organization) {
            if (!employee) {
                return $timeout(function () {
                    return [];
                });
            }

            var domainName = employee.hasOwnProperty('domainName') ? employee.domainName : employee;
            var ouId = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get(urlService.followupEmployeeInbox.change({
                domainName: domainName,
                ouId: ouId
            })).then(function (result) {
                self.followupEmployeeInboxes = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                self.followupEmployeeInboxes = generator.interceptReceivedCollection('WorkItem', self.followupEmployeeInboxes);
                return self.followupEmployeeInboxes;
                //return _.sortBy(self.followupEmployeeInboxes, 'generalStepElm.starred').reverse();
            });
        };

        /**
         * @description Get followup employee inboxes from self.followupEmployeeInboxes if found and if not load it from server again.
         * @returns {Promise|followupEmployeeInboxes}
         */
        self.getFollowupEmployeeInboxes = function () {
            return self.followupEmployeeInboxes.length ? $q.when(self.followupEmployeeInboxes) : self.loadFollowupEmployeeInboxes();
        };

        /**
         * @description Contains methods for operations for followup employee inbox items
         */
        self.controllerMethod = {
            /**
             * @description Opens the dialog to select the organization and the user to get the data in the grid
             * @param selectedOrganization
             * @param selectedUser
             * @param availableUsers
             * @param isFollowupSentItems
             * @param $event
             */
            openOrganizationAndUserDialog: function (selectedOrganization, selectedUser, availableUsers, isFollowupSentItems, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('followup-employee-inbox'),
                        controller: 'followupEmployeeInboxPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            selectedOrganization: selectedOrganization,
                            selectedUser: selectedUser,
                            isFollowupSentItems: isFollowupSentItems
                        },
                        resolve: {
                            followUpOrganizations: function (organizationService) {
                                'ngInject';
                                return organizationService.getFollowUpOrganizations();
                            },
                            ouApplicationUsers: function (ouApplicationUserService) {
                                'ngInject';
                                return selectedOrganization ?
                                    ouApplicationUserService.loadRelatedOUApplicationUsers(selectedOrganization) : [];
                            }
                        }
                    });
            },
            /**
             * @description Star followup employee inbox
             * @param followupEmployeeInbox
             * @param $event
             */
            followupEmployeeInboxStar: function (followupEmployeeInbox, $event) {
                return self.starFollowupEmployeeInbox(followupEmployeeInbox)
                    .then(function (result) {
                        //toast.success(langService.get("star_specific_success").change({name: followupEmployeeInbox.docSubject}));
                        return result;
                    })
            },
            /**
             * @description Star bulk followup employee inbox items
             * @param followupEmployeeInboxes
             * @param $event
             */
            followupEmployeeInboxStarBulk: function (followupEmployeeInboxes, $event) {
                return self.starBulkFollowupEmployeeInboxes(followupEmployeeInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === followupEmployeeInboxes.length) {
                            toast.error(langService.get("failed_star_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('star_success_except_following', _.map(result, function (followupEmployeeInbox) {
                                return followupEmployeeInbox.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_star_success"));
                            response = true;
                        }
                        return response;
                    });
            },
            /**
             * @description UnStar followup employee inbox
             * @param followupEmployeeInbox
             * @param $event
             */
            followupEmployeeInboxUnStar: function (followupEmployeeInbox, $event) {
                return self.unStarFollowupEmployeeInbox(followupEmployeeInbox)
                    .then(function (result) {
                        //toast.success(langService.get("unstar_specific_success").change({name: followupEmployeeInbox.docSubject}));
                        return result;
                    })
            },
            /**
             * @description UnStar bulk followup employee inbox items
             * @param followupEmployeeInboxes
             * @param $event
             */
            followupEmployeeInboxUnStarBulk: function (followupEmployeeInboxes, $event) {
                return self.unStarBulkFollowupEmployeeInboxes(followupEmployeeInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === followupEmployeeInboxes.length) {
                            toast.error(langService.get("failed_unstar_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('unstar_success_except_following', _.map(result, function (followupEmployeeInbox) {
                                return followupEmployeeInbox.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_unstar_success"));
                            response = true;
                        }
                        return response;
                    });
            },
            /**
             * @description Terminate followup employee inbox
             * @param followupEmployeeInbox
             * @param $event
             * @param justReason
             */
            followupEmployeeInboxTerminate: function (followupEmployeeInbox, $event, justReason) {
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
                                /*return userCommentService.getUserComments()
                                    .then(function (result) {
                                        return _.filter(result, 'status');
                                    });*/
                                return userCommentService.loadUserCommentsForDistribution();
                            }
                        }
                    }).then(function (reason) {
                        // to check if you need to return just the reason and no operation.
                        if (justReason)
                            return reason;

                        return self.terminateFollowupEmployeeInbox(followupEmployeeInbox, reason)
                            .then(function () {
                                return true;
                            })
                    });

                /*return self.terminateFollowupEmployeeInbox(followupEmployeeInbox)
                    .then(function (result) {
                        //toast.success(langService.get("terminate_specific_success").change({name: followupEmployeeInbox.docSubject}));
                        return true;
                    })*/
            },
            /**
             * @description Terminate bulk followup employee inbox items
             * @param workItems
             * @param $event
             */
            followupEmployeeInboxTerminateBulk: function (workItems, $event) {
                // if the selected workItem has just one record.
                if (workItems.length === 1)
                    return self.controllerMethod.followupEmployeeInboxTerminate(workItems[0]);

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
                                /*return userCommentService.getUserComments()
                                    .then(function (result) {
                                        return _.filter(result, 'status');
                                    });*/
                                return userCommentService.loadUserCommentsForDistribution();
                            }
                        }
                    })
                    .then(function (workItems) {
                        self.terminateBulkFollowupEmployeeInboxes(workItems)
                            .then(function (result) {
                                var response = false;
                                if (result.length === workItems.length) {
                                    toast.error(langService.get("failed_terminate_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('following_records_failed_to_terminate', _.map(result, function (followupEmployeeInbox) {
                                        return followupEmployeeInbox.getTranslatedName();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("selected_terminate_success"));
                                    response = true;
                                }
                                return response;
                            });

                    });

                /*return self.terminateBulkFollowupEmployeeInboxes(followupEmployeeInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === followupEmployeeInboxes.length) {
                            toast.error(langService.get("failed_terminate_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('following_records_failed_to_terminate', _.map(result, function (followupEmployeeInbox) {
                                return followupEmployeeInbox.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_terminate_success"));
                            response = true;
                        }
                        return response;
                    });*/
            },
            /**
             * @description Mark the item as read/unread
             * @param followupEmployeeInbox
             * @param $event
             */
            followupInboxMarkAsReadUnread: function (followupEmployeeInbox, $event) {
                return self.markAsReadUnread(followupEmployeeInbox)
                    .then(function (result) {
                        followupEmployeeInbox.generalStepElm.isOpen = !followupEmployeeInbox.generalStepElm.isOpen;
                        return followupEmployeeInbox;
                    });
            }
        };

        /**
         * @description Get followup employee inbox by followupEmployeeInboxId
         * @param followupEmployeeInboxId
         * @returns {WorkItem|undefined} return WorkItem Model or undefined if not found.
         */
        self.getFollowupEmployeeInboxById = function (followupEmployeeInboxId) {
            followupEmployeeInboxId = followupEmployeeInboxId instanceof WorkItem ? followupEmployeeInboxId.id : followupEmployeeInboxId;
            return _.find(self.followupEmployeeInboxes, function (followupEmployeeInbox) {
                return Number(followupEmployeeInbox.id) === Number(followupEmployeeInboxId);
            });
        };

        /**
         * @description Star followup employee inbox item
         * @param followupEmployeeInbox
         */
        self.starFollowupEmployeeInbox = function (followupEmployeeInbox) {
            var wob = followupEmployeeInbox.hasOwnProperty('generalStepElm')
                ? (followupEmployeeInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(followupEmployeeInbox.generalStepElm.workObjectNumber) : JSON.parse(followupEmployeeInbox.generalStepElm))
                : (followupEmployeeInbox.hasOwnProperty('workObjectNumber') ? new Array(followupEmployeeInbox.workObjectNumber) : JSON.parse(followupEmployeeInbox));
            return $http
                .put(urlService.userInbox + '/star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description UnStar followup employee inbox item
         * @param followupEmployeeInbox
         */
        self.unStarFollowupEmployeeInbox = function (followupEmployeeInbox) {
            var wob = followupEmployeeInbox.hasOwnProperty('generalStepElm')
                ? (followupEmployeeInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(followupEmployeeInbox.generalStepElm.workObjectNumber) : new Array(followupEmployeeInbox.generalStepElm))
                : (followupEmployeeInbox.hasOwnProperty('workObjectNumber') ? new Array(followupEmployeeInbox.workObjectNumber) : new Array(followupEmployeeInbox));
            return $http
                .put(urlService.userInbox + '/un-star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description Star bulk followup employee inbox items
         * @param followupEmployeeInboxes
         */
        self.starBulkFollowupEmployeeInboxes = function (followupEmployeeInboxes) {
            var bulkWob = followupEmployeeInboxes[0].hasOwnProperty('generalStepElm')
                ? (followupEmployeeInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(followupEmployeeInboxes, 'generalStepElm.workObjectNumber') : followupEmployeeInboxes)
                : (followupEmployeeInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(followupEmployeeInboxes, 'workObjectNumber') : followupEmployeeInboxes);
            return $http
                .put(urlService.userInbox + '/star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedFollowupEmployeeInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedFollowupEmployeeInboxes.push(key);
                    });
                    return _.filter(bulkWob, function (followupEmployeeInbox) {
                        return (failedFollowupEmployeeInboxes.indexOf(followupEmployeeInbox) > -1);
                    });
                });
        };

        /**
         * @description Un-star bulk followup employee inbox
         * @param followupEmployeeInboxes
         */
        self.unStarBulkFollowupEmployeeInboxes = function (followupEmployeeInboxes) {
            var bulkWob = followupEmployeeInboxes[0].hasOwnProperty('generalStepElm')
                ? (followupEmployeeInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(followupEmployeeInboxes, 'generalStepElm.workObjectNumber') : followupEmployeeInboxes)
                : (followupEmployeeInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(followupEmployeeInboxes, 'workObjectNumber') : followupEmployeeInboxes);
            return $http
                .put(urlService.userInbox + '/un-star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedFollowupEmployeeInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedFollowupEmployeeInboxes.push(key);
                    });
                    return _.filter(bulkWob, function (followupEmployeeInbox) {
                        return (failedFollowupEmployeeInboxes.indexOf(followupEmployeeInbox) > -1);
                    });
                });
        };

        /**
         * @description Terminate followup employee inbox item
         * @param {WorkItem} followupEmployeeInbox
         * @param reason
         */
        self.terminateFollowupEmployeeInbox = function (followupEmployeeInbox, reason) {
            var info = followupEmployeeInbox.getInfo();
            //var wfName = "outgoing";
            return $http
                .put(urlService.followupEmployeeInboxActions + "/" + info.documentClass + "/terminate/wob-num", {
                    first: info.wobNumber,
                    second: reason
                })
                .then(function (result) {
                    return followupEmployeeInbox;
                });
        };

        /**
         * @description Terminate bulk followup employee inbox items
         * @param workItems
         */
        self.terminateBulkFollowupEmployeeInboxes = function (workItems) {
            var items = _.map(workItems, function (workItem) {
                return {
                    first: workItem.getWobNumber(),
                    second: workItem.reason
                };
            });

            var wfName = "outgoing";

            return $http
                .put((urlService.followupEmployeeInboxActions + "/" + wfName.toLowerCase() + "/terminate/bulk"), items)
                .then(function (result) {
                    result = result.data.rs;
                    var failedFollowupEmployeeInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedFollowupEmployeeInboxes.push(key);
                    });
                    return _.filter(workItems, function (followupEmployeeInbox) {
                        return (failedFollowupEmployeeInboxes.indexOf(followupEmployeeInbox.generalStepElm.workObjectNumber) > -1);
                    });
                });

            /*var bulkFollowupEmployeeInboxes = followupEmployeeInboxes[0].hasOwnProperty('generalStepElm')
                ? (followupEmployeeInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(followupEmployeeInboxes, 'generalStepElm.workObjectNumber') : followupEmployeeInboxes)
                : (followupEmployeeInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(followupEmployeeInboxes, 'workObjectNumber') : followupEmployeeInboxes);

            //var wfName = followupEmployeeInboxes[0].hasOwnProperty('generalStepElm')
            //    ? (followupEmployeeInboxes[0].generalStepElm.hasOwnProperty('workFlowName') ? _.map(followupEmployeeInboxes, 'generalStepElm.workFlowName') : followupEmployeeInboxes)
            //    : (followupEmployeeInboxes[0].hasOwnProperty('workFlowName') ? _.map(followupEmployeeInboxes, 'workFlowName') : followupEmployeeInboxes);

            var wfName = "outgoing";

            return $http
                .put((urlService.followupEmployeeInboxActions + "/" + wfName.toLowerCase() + "/terminate/bulk"), bulkFollowupEmployeeInboxes)
                .then(function (result) {
                    result = result.data.rs;
                    var failedFollowupEmployeeInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedFollowupEmployeeInboxes.push(key);
                    });
                    return _.filter(followupEmployeeInboxes, function (followupEmployeeInbox) {
                        return (failedFollowupEmployeeInboxes.indexOf(followupEmployeeInbox.workObjectNumber) > -1);
                    });
                });*/
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param followupEmployeeInbox
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateFollowupEmployeeInbox = function (followupEmployeeInbox, editMode) {
            var followupEmployeeInboxesToFilter = self.followupEmployeeInboxes;
            if (editMode) {
                followupEmployeeInboxesToFilter = _.filter(followupEmployeeInboxesToFilter, function (followupEmployeeInboxToFilter) {
                    return followupEmployeeInboxToFilter.id !== followupEmployeeInbox.id;
                });
            }
            return _.some(_.map(followupEmployeeInboxesToFilter, function (existingFollowupEmployeeInbox) {
                return existingFollowupEmployeeInbox.arName === followupEmployeeInbox.arName
                    || existingFollowupEmployeeInbox.enName.toLowerCase() === followupEmployeeInbox.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };


        /**
         * @description Sign the document
         * @param followupEmployeeInbox
         * @param signature
         */
        self.signDocument = function (followupEmployeeInbox, signature) {
            var signatureModel = {
                bookVsid: followupEmployeeInbox.generalStepElm.vsId,
                signatureVsid: signature.hasOwnProperty('vsId') ? signature.vsId : signature,
                wobNum: followupEmployeeInbox.generalStepElm.workObjectNumber
            };

            return $http
                .put((urlService.outgoings + '/authorize'), signatureModel)
                .then(function () {
                    return true;
                });
        };

        /**
         * @description Mark the item as read/unread
         * @param followupEmployeeInbox
         */
        self.markAsReadUnread = function (followupEmployeeInbox) {
            var isOpen = followupEmployeeInbox.hasOwnProperty('generalStepElm')
                ? (followupEmployeeInbox.generalStepElm.hasOwnProperty('isOpen') ? followupEmployeeInbox.generalStepElm.isOpen : followupEmployeeInbox.generalStepElm)
                : (followupEmployeeInbox.hasOwnProperty('isOpen') ? followupEmployeeInbox.isOpen : followupEmployeeInbox);
            var wob = followupEmployeeInbox.hasOwnProperty('generalStepElm')
                ? (followupEmployeeInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? followupEmployeeInbox.generalStepElm.workObjectNumber : followupEmployeeInbox.generalStepElm)
                : (followupEmployeeInbox.hasOwnProperty('workObjectNumber') ? followupEmployeeInbox.workObjectNumber : followupEmployeeInbox);
            var readUnread = isOpen ? '/un-read' : '/read';
            return $http
                .put((urlService.userInbox + readUnread), new Array(wob))
                .then(function () {
                    return true;
                });
        };

        /**
         * @description Load the followup employee sent items from server.
         * @returns {Promise|followupEmployeeSentItems}
         */
        self.loadFollowupEmployeeSentItems = function (employee, organization, page, limit) {
            if (!employee) {
                return $timeout(function () {
                    return [];
                });
            }

            var offset = ((page - 1) * limit);
            var userId = employee.hasOwnProperty('id') ? employee.id : employee;
            var ouId = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get(urlService.followupEmployeeSentItems.change({
                userId: userId,
                ouId: ouId
            }), {
                params: {
                    offset: offset,
                    limit: limit
                }
            }).then(function (result) {
                self.followupSentItemsTotalCount = result.data.count;
                self.followupEmployeeSentItems = generator.generateCollection(result.data.rs, EventHistory, self._sharedMethods);
                self.followupEmployeeSentItems = generator.interceptReceivedCollection('EventHistory', self.followupEmployeeSentItems);
                return self.followupEmployeeSentItems;
            });
        };

        /**
         * @description Get followup employee sent items from self.followupEmployeeSentItems if found and if not load it from server again.
         * @returns {Promise|followupEmployeeSentItems}
         */
        self.getFollowupEmployeeSentItems = function (page, limit) {
            return self.followupEmployeeSentItems.length ? $q.when(self.followupEmployeeSentItems) : self.loadUserSentItems(page, limit);
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteFollowupEmployeeInbox, self.updateFollowupEmployeeInbox);
    });
};
