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
                                              applicationUserSignatureService,
                                              listGeneratorService,
                                              $window) {
        'ngInject';
        var self = this;
        self.serviceName = 'userInboxService';

        self.userInboxes = [];

        self.currentUser = employeeService.getEmployee();

        /**
         * @description Load the user inboxes from server.
         * @returns {Promise|userInboxes}
         */
        self.loadUserInboxes = function () {
            return $http.get(urlService.userInbox + '/all-mails').then(function (result) {
                self.userInboxes = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                //self.userInboxes = _.sortBy(self.userInboxes, 'generalStepElm.starred').reverse();
                self.userInboxes = generator.interceptReceivedCollection('WorkItem', self.userInboxes);
                return self.userInboxes;
            });
        };

        /**
         * @description Get user inboxes from self.userInboxes if found and if not load it from server again.
         * @returns {Promise|userInboxes}
         */
        self.getUserInboxes = function () {
            return self.userInboxes.length ? $q.when(self.userInboxes) : self.loadUserInboxes();
        };

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
                        template: cmsTemplate.getPopup('reason'),
                        controller: 'reasonPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            justReason: justReason
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
                        template: cmsTemplate.getPopup('reason-bulk'),
                        controller: 'reasonBulkPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            workItems: workItems
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
                    })
                    .then(function (workItems) {
                        self.terminateBulkUserInboxes(workItems)
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
             * @param $event
             * @returns {promise}
             */
            userInboxSignaturePopup: function (userInbox, $event) {
                return applicationUserSignatureService.getApplicationUserSignatures(self.currentUser.id)
                    .then(function (signatures) {
                        self.currentUser.signature = signatures;
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
                        }
                        else if (signatures && signatures.length > 1) {
                            return dialog
                                .showDialog({
                                    targetEvent: $event,
                                    template: cmsTemplate.getPopup('signature'),
                                    controller: 'signaturePopCtrl',
                                    controllerAs: 'ctrl',
                                    locals: {
                                        userInbox: userInbox,
                                        signatures: signatures
                                    }
                                });
                        }
                        else {
                            dialog.alertMessage(langService.get('no_signature_available'))
                        }
                    });
            },
            /**
             * @description Mark the item as read/unread
             * @param userInbox
             * @param $event
             */
            userInboxMarkAsReadUnread: function (userInbox, $event) {
                return self.markAsReadUnread(userInbox)
                    .then(function (result) {
                        userInbox.generalStepElm.isOpen = !userInbox.generalStepElm.isOpen;
                        return userInbox;
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
         * @param userInbox
         */
        self.markAsReadUnread = function (userInbox) {
            var isOpen = userInbox.hasOwnProperty('generalStepElm')
                ? (userInbox.generalStepElm.hasOwnProperty('isOpen') ? userInbox.generalStepElm.isOpen : userInbox.generalStepElm)
                : (userInbox.hasOwnProperty('isOpen') ? userInbox.isOpen : userInbox);
            var wob = userInbox.hasOwnProperty('generalStepElm')
                ? (userInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? userInbox.generalStepElm.workObjectNumber : userInbox.generalStepElm)
                : (userInbox.hasOwnProperty('workObjectNumber') ? userInbox.workObjectNumber : userInbox);
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
