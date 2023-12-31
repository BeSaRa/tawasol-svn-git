module.exports = function (app) {
    app.service('userInboxService', function (urlService,
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
                                              employeeService,
                                              applicationUserSignatureService) {
        'ngInject';
        var self = this;
        self.serviceName = 'userInboxService';

        self.userInboxes = [];
        self.totalCount = 0;

        self.starredUserInboxes = [];
        self.starredTotalCount = 0;

        // self.currentUser = employeeService.getEmployee();
        self.fakeUsersInboxForTest = function () {
            var items = _.map(_.range(0, 20), function () {
                return new WorkItem({
                    generalStepElm: {
                        docSubject: 'جولة وفد الدولة بمشاركة قيادات الوزارة واتحاد الغرف وغرفة التجارة والصناعة',
                        docType: 0,
                        workFlowName: 'Outgoing'
                    }
                })
            });

            console.log(items);

            return $q.when(items);
        };

        /**
         * @description Load the user inboxes from server.
         * @param excludeLoading
         * @param afterTime - time difference between now and interval for user
         * @param ignoreTokenRefresh
         * @param page
         * @param limit
         * @param criteria
         * @returns {Promise|userInboxes}
         */
        self.loadUserInboxes = function (excludeLoading, afterTime, ignoreTokenRefresh, page, limit, criteria) {
            var params = _prepareLoadInboxParams(afterTime, ignoreTokenRefresh, page, limit, criteria);

            return $http.get(urlService.userInbox + '/all-mails', {
                excludeLoading: !!excludeLoading,
                params: params
            }).then(function (result) {
                self.totalCount = result.data.count;
                self.userInboxes = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                self.userInboxes = generator.interceptReceivedCollection('WorkItem', self.userInboxes);
                return self.userInboxes;
            });
        };

        /**
         * @description Get user inboxes from self.userInboxes if found and if not load it from server again.
         * @returns {Promise|userInboxes}
         */
        self.getUserInboxes = function (excludeLoading, afterTime, ignoreTokenRefresh, page, limit, criteria) {
            return self.userInboxes.length ? $q.when(self.userInboxes) : self.loadUserInboxes(excludeLoading, afterTime, ignoreTokenRefresh, page, limit, criteria);
        };

        /**
         * @description load starred user inbox work items
         * @param excludeLoading
         * @param page
         * @param limit
         * @param criteria
         * @returns {*}
         */
        self.loadStarredUserInboxes = function (excludeLoading, page, limit, criteria) {
            var params = _prepareLoadInboxParams(null, false, page, limit, criteria);

            return $http.get(urlService.userInbox + '/starred', {
                excludeLoading: !!excludeLoading,
                params: params
            }).then(function (result) {
                self.starredTotalCount = result.data.count;
                self.starredUserInboxes = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                self.starredUserInboxes = generator.interceptReceivedCollection('WorkItem', self.starredUserInboxes);
                return self.starredUserInboxes;
            });
        }

        /**
         * @description get work item by vsId
         * @returns {Promise<T>}
         * @param wobNum
         */
        self.getUserInboxItemByWobNumber = function (wobNum) {
            var params = _prepareLoadInboxParams(null, false, 1, 5, wobNum);

            return $http.get(urlService.userInbox + '/all-mails', {
                excludeLoading: false,
                params: params
            }).then(function (result) {
                var userInboxes = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                userInboxes = generator.interceptReceivedCollection('WorkItem', userInboxes);
                return userInboxes[0];
            })
        }

        function _prepareLoadInboxParams(afterTime, ignoreTokenRefresh, page, limit, criteria) {
            var offset = ((page - 1) * limit);
            var params = {
                'optional-fields': 'registeryOu',
                'offset': offset,
                'limit': limit
            };

            if (criteria) {
                params.criteria = criteria;
            }
            if (afterTime) {
                params.afterTime = (afterTime + '').substr(0, ('' + afterTime).length - 3);
            }
            if (ignoreTokenRefresh) {
                params.ignoreTokenRefresh = true;
            }

            return params;
        }



        /**
         * @description Contains methods for operations for user inbox items
         */
        self.controllerMethod = {
            /**
             * @description Star user inbox
             * @param userInbox
             * @param $event
             */
            userInboxStar: function (userInbox, $event) {
                return self.starUserInbox(userInbox)
                    .then(function (result) {
                        //toast.success(langService.get("star_specific_success").change({name: userInbox.docSubject}));
                        return result;
                    })
            },
            /**
             * @description Star bulk user inbox items
             * @param userInboxes
             * @param $event
             */
            userInboxStarBulk: function (userInboxes, $event) {
                return self.starBulkUserInboxes(userInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === userInboxes.length) {
                            toast.error(langService.get("failed_star_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('star_success_except_following', _.map(result, function (userInbox) {
                                return userInbox.getTranslatedName();
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
             * @description UnStar user inbox
             * @param userInbox
             * @param $event
             */
            userInboxUnStar: function (userInbox, $event) {
                return self.unStarUserInbox(userInbox)
                    .then(function (result) {
                        //toast.success(langService.get("unstar_specific_success").change({name: userInbox.docSubject}));
                        return result;
                    })
            },
            /**
             * @description UnStar bulk user inbox items
             * @param userInboxes
             * @param $event
             */
            userInboxUnStarBulk: function (userInboxes, $event) {
                return self.unStarBulkUserInboxes(userInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === userInboxes.length) {
                            toast.error(langService.get("failed_unstar_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('unstar_success_except_following', _.map(result, function (userInbox) {
                                return userInbox.getTranslatedName();
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
             * @description Terminate user inbox
             * @param userInbox
             * @param $event
             * @param justReason
             */
            userInboxTerminate: function (userInbox, $event, justReason) {
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

                        return self.terminateUserInbox(userInbox, reason)
                            .then(function () {
                                return true;
                            })
                    });

            },
            /**
             * @description Terminate bulk user inbox items
             * @param workItems
             * @param $event
             */
            userInboxTerminateBulk: function (workItems, $event) {
                // if the selected workItem has just one record.
                if (workItems.length === 1)
                    return self.controllerMethod.userInboxTerminate(workItems[0]);

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
                        return self.terminateBulkUserInboxes(workItems)
                            .then(function (result) {
                                var response = false;
                                if (result.length === workItems.length) {
                                    toast.error(langService.get("failed_terminate_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('following_records_failed_to_terminate', _.map(result, function (userInbox) {
                                        return userInbox.getTranslatedName();
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

            /**
             * @description Opens the popup to select signature
             * @param userInbox
             * @param isRecursiveRequest
             * @param $event
             * @returns {promise}
             */
            userInboxSignaturePopup: function (userInbox, isRecursiveRequest, $event) {
                return applicationUserSignatureService.getApplicationUserSignatures(employeeService.getEmployee().id)
                    .then(function (signatures) {
                        //self.currentUser.signature = signatures;
                        if (signatures && signatures.length === 1) {
                            return self.signDocument(userInbox, signatures[0])
                                .then(function (result) {
                                    if (result)
                                        return true;
                                    else {
                                        toast.error(langService.get('something_happened_when_sign'));
                                        return false;
                                    }
                                });
                        } else if (signatures && signatures.length > 1) {
                            return dialog
                                .showDialog({
                                    targetEvent: $event,
                                    templateUrl: cmsTemplate.getPopup('signature'),
                                    controller: 'signaturePopCtrl',
                                    controllerAs: 'ctrl',
                                    locals: {
                                        userInbox: userInbox,
                                        signatures: signatures
                                    }
                                });
                        } else {
                            dialog.alertMessage(langService.get('no_signature_available'));

                            /*Open the user preference with signature tab focused*/
                            /*if (!isRecursiveRequest) {
                                dialog.alertMessage(langService.get('no_signature_available'))
                                    .then(function () {
                                        applicationUserService.controllerMethod.manageUserPreference(null, 'signature', null)
                                            .then(function (signaturesResult) {
                                                if (signaturesResult && signaturesResult.length) {
                                                    self.controllerMethod.userInboxSignaturePopup(userInbox, true, null)
                                                        .then(function (result) {
                                                            if (result)
                                                                return true;
                                                            else {
                                                                toast.error(langService.get('something_happened_when_sign'));
                                                                return false;
                                                            }
                                                        });
                                                }
                                            });
                                    });
                            }*/
                        }
                    });
            },
            /**
             * @description Mark the item as read/unread
             * @param workItem
             * @param $event
             */
            userInboxMarkAsReadUnread: function (workItem, $event) {
                return self.markAsReadUnread(workItem)
                    .then(function (result) {
                        workItem.generalStepElm.isOpen = !workItem.generalStepElm.isOpen;
                        return workItem;
                    });
            }
        };

        /**
         * @description Get user inbox by userInboxId
         * @param userInboxId
         * @returns {WorkItem|undefined} return WorkItem Model or undefined if not found.
         */
        self.getUserInboxById = function (userInboxId) {
            userInboxId = userInboxId instanceof WorkItem ? userInboxId.id : userInboxId;
            return _.find(self.userInboxes, function (userInbox) {
                return Number(userInbox.id) === Number(userInboxId);
            });
        };

        /**
         * @description Star user inbox item
         * @param userInbox
         */
        self.starUserInbox = function (userInbox) {
            var wob = userInbox.hasOwnProperty('generalStepElm')
                ? (userInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(userInbox.generalStepElm.workObjectNumber) : JSON.parse(userInbox.generalStepElm))
                : (userInbox.hasOwnProperty('workObjectNumber') ? new Array(userInbox.workObjectNumber) : JSON.parse(userInbox));
            return $http
                .put(urlService.userInbox + '/star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description UnStar user inbox item
         * @param userInbox
         */
        self.unStarUserInbox = function (userInbox) {
            var wob = userInbox.hasOwnProperty('generalStepElm')
                ? (userInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(userInbox.generalStepElm.workObjectNumber) : new Array(userInbox.generalStepElm))
                : (userInbox.hasOwnProperty('workObjectNumber') ? new Array(userInbox.workObjectNumber) : new Array(userInbox));
            return $http
                .put(urlService.userInbox + '/un-star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description Star bulk user inbox items
         * @param userInboxes
         */
        self.starBulkUserInboxes = function (userInboxes) {
            var bulkWob = userInboxes[0].hasOwnProperty('generalStepElm')
                ? (userInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(userInboxes, 'generalStepElm.workObjectNumber') : userInboxes)
                : (userInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(userInboxes, 'workObjectNumber') : userInboxes);
            return $http
                .put(urlService.userInbox + '/star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedUserInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedUserInboxes.push(key);
                    });
                    return _.filter(bulkWob, function (userInbox) {
                        return (failedUserInboxes.indexOf(userInbox) > -1);
                    });
                });
        };

        /**
         * @description Un-star bulk user inbox
         * @param userInboxes
         */
        self.unStarBulkUserInboxes = function (userInboxes) {
            var bulkWob = userInboxes[0].hasOwnProperty('generalStepElm')
                ? (userInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(userInboxes, 'generalStepElm.workObjectNumber') : userInboxes)
                : (userInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(userInboxes, 'workObjectNumber') : userInboxes);
            return $http
                .put(urlService.userInbox + '/un-star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedUserInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedUserInboxes.push(key);
                    });
                    return _.filter(bulkWob, function (userInbox) {
                        return (failedUserInboxes.indexOf(userInbox) > -1);
                    });
                });
        };

        /**
         * @description Terminate user inbox item
         * @param {WorkItem} userInbox
         * @param reason
         */
        self.terminateUserInbox = function (userInbox, reason) {
            var info = userInbox.getInfo();
            return $http
                .put(urlService.userInboxActions + "/" + info.documentClass + "/terminate/wob-num", {
                    first: info.wobNumber,
                    second: reason
                })
                .then(function (result) {
                    return userInbox;
                });
        };

        /**
         * @description Export user inbox item
         * @param {WorkItem} userInbox
         */
        self.exportUserInbox = function (userInbox) {
            var vsId = userInbox.hasOwnProperty('generalStepElm')
                ? (userInbox.generalStepElm.hasOwnProperty('vsId') ? userInbox.generalStepElm.vsId : userInbox.generalStepElm)
                : (userInbox.hasOwnProperty('vsId') ? userInbox.vsId : userInbox);
            // var wfName = userInbox.hasOwnProperty('generalStepElm')
            //     ? (userInbox.generalStepElm.hasOwnProperty('workFlowName') ? userInbox.generalStepElm.workFlowName : userInbox.generalStepElm)
            //     : (userInbox.hasOwnProperty('workFlowName') ? userInbox.workFlowName : userInbox);

            var workObjectNumber = userInbox.hasOwnProperty('generalStepElm')
                ? (userInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? userInbox.generalStepElm.workObjectNumber : userInbox.generalStepElm)
                : (userInbox.hasOwnProperty('workObjectNumber') ? userInbox.workObjectNumber : userInbox);

            var wfName = "outgoing";
            return $http
                .put(urlService.userInboxActions + "/" + wfName.toLowerCase() + "/book/" + vsId + "/wob-num/" + workObjectNumber + "/export")
                .then(function (result) {
                    return userInbox;
                });
        };

        /**
         * @description Terminate bulk user inbox items
         * @param workItems
         */
        self.terminateBulkUserInboxes = function (workItems) {
            var items = _.map(workItems, function (workItem) {
                return {
                    first: workItem.getWobNumber(),
                    second: workItem.reason
                };
            });

            var wfName = "outgoing";

            return $http
                .put((urlService.userInboxActions + "/" + wfName.toLowerCase() + "/terminate/bulk"), items)
                .then(function (result) {
                    result = result.data.rs;
                    var failedUserInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedUserInboxes.push(key);
                    });
                    return _.filter(workItems, function (userInbox) {
                        return (failedUserInboxes.indexOf(userInbox.generalStepElm.workObjectNumber) > -1);
                    });
                });
        };


        /**
         * @description Activate user inbox
         * @param userInbox
         */
        self.activateUserInbox = function (userInbox) {
            return $http
                .put((urlService.userInbox + '/activate/' + userInbox.id))
                .then(function () {
                    return userInbox;
                });
        };

        /**
         * @description Deactivate user inbox
         * @param userInbox
         */
        self.deactivateUserInbox = function (userInbox) {
            return $http
                .put((urlService.userInbox + '/deactivate/' + userInbox.id))
                .then(function () {
                    return userInbox;
                });
        };

        /**
         * @description Activate bulk of user inboxes
         * @param userInboxes
         */
        self.activateBulkUserInboxes = function (userInboxes) {
            var bulkIds = userInboxes[0].hasOwnProperty('id') ? _.map(userInboxes, 'id') : userInboxes;
            return $http
                .put((urlService.userInbox + '/activate/bulk'), bulkIds)
                .then(function () {
                    return userInboxes;
                });
        };

        /**
         * @description Deactivate bulk of user inboxes
         * @param userInboxes
         */
        self.deactivateBulkUserInboxes = function (userInboxes) {
            var bulkIds = userInboxes[0].hasOwnProperty('id') ? _.map(userInboxes, 'id') : userInboxes;
            return $http
                .put((urlService.userInbox + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return userInboxes;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param userInbox
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateUserInbox = function (userInbox, editMode) {
            var userInboxesToFilter = self.userInboxes;
            if (editMode) {
                userInboxesToFilter = _.filter(userInboxesToFilter, function (userInboxToFilter) {
                    return userInboxToFilter.id !== userInbox.id;
                });
            }
            return _.some(_.map(userInboxesToFilter, function (existingUserInbox) {
                return existingUserInbox.arName === userInbox.arName
                    || existingUserInbox.enName.toLowerCase() === userInbox.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Sign the document
         * @param userInbox
         * @param signature
         */
        self.signDocument = function (userInbox, signature) {
            var signatureModel = {
                bookVsid: userInbox.getInfo().vsId,
                signatureVsid: signature.hasOwnProperty('vsId') ? signature.vsId : signature,
                wobNum: userInbox.generalStepElm.workObjectNumber
            };

            return $http
                .put((urlService.outgoings + '/authorize'), signatureModel)
                .then(function () {
                    return true;
                });
        };


        /**
         * @description Mark the item as read/unread
         * @param workItem
         */
        self.markAsReadUnread = function (workItem) {
            var isOpen = workItem.hasOwnProperty('generalStepElm')
                ? (workItem.generalStepElm.hasOwnProperty('isOpen') ? workItem.generalStepElm.isOpen : workItem.generalStepElm)
                : (workItem.hasOwnProperty('isOpen') ? workItem.isOpen : workItem);
            var wob = workItem.hasOwnProperty('generalStepElm')
                ? (workItem.generalStepElm.hasOwnProperty('workObjectNumber') ? workItem.generalStepElm.workObjectNumber : workItem.generalStepElm)
                : (workItem.hasOwnProperty('workObjectNumber') ? workItem.workObjectNumber : workItem);
            var readUnread = isOpen ? '/un-read' : '/read';
            return $http
                .put((urlService.userInbox + readUnread), new Array(wob))
                .then(function () {
                    return true;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteUserInbox, self.updateUserInbox);
    });
};
