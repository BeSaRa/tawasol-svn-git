module.exports = function (app) {
    app.service('approvedInternalService', function (urlService,
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
                                                     listGeneratorService,
                                                     $window) {
        'ngInject';
        var self = this;
        self.serviceName = 'approvedInternalService';

        self.approvedInternals = [];

        self.currentUser = employeeService.getEmployee();

        /**
         * @description Load the approved Internals from server.
         * @returns {Promise|approvedInternals}
         */
        self.loadApprovedInternals = function () {
            return $http.get(urlService.approvedInternal).then(function (result) {
                self.approvedInternals = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                self.approvedInternals = _.sortBy(self.approvedInternals, 'generalStepElm.starred').reverse();
                self.approvedInternals = generator.interceptReceivedCollection('WorkItem', self.approvedInternals);
                return self.approvedInternals;
            });
        };

        /**
         * @description Get approved Internals from self.approvedInternals if found and if not load it from server again.
         * @returns {Promise|approvedInternals}
         */
        self.getApprovedInternals = function () {
            return self.approvedInternals.length ? $q.when(self.approvedInternals) : self.loadApprovedInternals();
        };

        /**
         * @description Contains methods for operations for approved internal items
         */
        self.controllerMethod = {
            /**
             * @description Star approved internal
             * @param approvedInternal
             * @param $event
             */
            approvedInternalStar: function (approvedInternal, $event) {
                return self.starApprovedInternal(approvedInternal)
                    .then(function (result) {
                        //toast.success(langService.get("star_specific_success").change({name: approvedInternal.docSubject}));
                        return result;
                    })
            },
            /**
             * @description Star bulk approved internal items
             * @param approvedInternals
             * @param $event
             */
            approvedInternalStarBulk: function (approvedInternals, $event) {
                return self.starBulkApprovedInternals(approvedInternals)
                    .then(function (result) {
                        var response = false;
                        if (result.length === approvedInternals.length) {
                            toast.error(langService.get("failed_star_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('star_success_except_following', _.map(result, function (approvedInternal) {
                                return approvedInternal.getTranslatedName();
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
             * @description UnStar approved internal
             * @param approvedInternal
             * @param $event
             */
            approvedInternalUnStar: function (approvedInternal, $event) {
                return self.unStarApprovedInternal(approvedInternal)
                    .then(function (result) {
                        //toast.success(langService.get("unstar_specific_success").change({name: approvedInternal.docSubject}));
                        return result;
                    })
            },
            /**
             * @description UnStar bulk approved internal items
             * @param approvedInternals
             * @param $event
             */
            approvedInternalUnStarBulk: function (approvedInternals, $event) {
                return self.unStarBulkApprovedInternals(approvedInternals)
                    .then(function (result) {
                        var response = false;
                        if (result.length === approvedInternals.length) {
                            toast.error(langService.get("failed_unstar_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('unstar_success_except_following', _.map(result, function (approvedInternal) {
                                return approvedInternal.getTranslatedName();
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
             * @description Terminate approved internal
             * @param approvedInternal
             * @param $event
             */
            approvedInternalTerminate: function (approvedInternal, $event, justReason) {
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

                        return self.terminateApprovedInternal(approvedInternal, reason)
                            .then(function () {
                                return true;
                            })
                    });

                /*return self.terminateApprovedInternal(approvedInternal)
                    .then(function (result) {
                        //toast.success(langService.get("terminate_specific_success").change({name: approvedInternal.docSubject}));
                        return true;
                    })*/
            },
            /**
             * @description Terminate bulk approved internal items
             * @param workItems
             * @param $event
             */
            approvedInternalTerminateBulk: function (workItems, $event) {
                // if the selected workItem has just one record.
                if (workItems.length === 1)
                    return self.controllerMethod.approvedInternalTerminate(workItems[0]);

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
                                return userCommentService.getUserComments()
                                    .then(function(result){
                                        return _.filter(result, 'status');
                                    });
                            }
                        }
                    })
                    .then(function (workItems) {
                        self.terminateBulkApprovedInternals(workItems)
                            .then(function (result) {
                                var response = false;
                                if (result.length === workItems.length) {
                                    toast.error(langService.get("failed_terminate_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('following_records_failed_to_terminate', _.map(result, function (approvedInternal) {
                                        return approvedInternal.getTranslatedName();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("selected_terminate_success"));
                                    response = true;
                                }
                                return response;
                            });

                    });

                /*return self.terminateBulkApprovedInternals(approvedInternals)
                    .then(function (result) {
                        var response = false;
                        if (result.length === approvedInternals.length) {
                            toast.error(langService.get("failed_terminate_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('following_records_failed_to_terminate', _.map(result, function (approvedInternal) {
                                return approvedInternal.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_terminate_success"));
                            response = true;
                        }
                        return response;
                    });*/
            },
            approvedInternalMarkAsReadUnread: function (approvedInternal, $event) {
                return self.markAsReadUnread(approvedInternal)
                    .then(function (result) {
                        approvedInternal.generalStepElm.isOpen = !approvedInternal.generalStepElm.isOpen;
                        return approvedInternal;
                    });
            }
        };

        /**
         * @description Get approved internal by approvedInternalId
         * @param approvedInternalId
         * @returns {WorkItem|undefined} return WorkItem Model or undefined if not found.
         */
        self.getApprovedInternalById = function (approvedInternalId) {
            approvedInternalId = approvedInternalId instanceof WorkItem ? approvedInternalId.id : approvedInternalId;
            return _.find(self.approvedInternals, function (approvedInternal) {
                return Number(approvedInternal.id) === Number(approvedInternalId);
            });
        };

        /**
         * @description Star approved internal item
         * @param approvedInternal
         */
        self.starApprovedInternal = function (approvedInternal) {
            var wob = approvedInternal.hasOwnProperty('generalStepElm')
                ? (approvedInternal.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(approvedInternal.generalStepElm.workObjectNumber) : JSON.parse(approvedInternal.generalStepElm))
                : (approvedInternal.hasOwnProperty('workObjectNumber') ? new Array(approvedInternal.workObjectNumber) : JSON.parse(approvedInternal));
            return $http
                .put(urlService.approvedInternal + '/star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description UnStar approved internal item
         * @param approvedInternal
         */
        self.unStarApprovedInternal = function (approvedInternal) {
            var wob = approvedInternal.hasOwnProperty('generalStepElm')
                ? (approvedInternal.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(approvedInternal.generalStepElm.workObjectNumber) : new Array(approvedInternal.generalStepElm))
                : (approvedInternal.hasOwnProperty('workObjectNumber') ? new Array(approvedInternal.workObjectNumber) : new Array(approvedInternal));
            return $http
                .put(urlService.approvedInternal + '/un-star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description Star bulk approved internal items
         * @param approvedInternals
         */
        self.starBulkApprovedInternals = function (approvedInternals) {
            var bulkWob = approvedInternals[0].hasOwnProperty('generalStepElm')
                ? (approvedInternals[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(approvedInternals, 'generalStepElm.workObjectNumber') : approvedInternals)
                : (approvedInternals[0].hasOwnProperty('workObjectNumber') ? _.map(approvedInternals, 'workObjectNumber') : approvedInternals);
            return $http
                .put(urlService.approvedInternal + '/star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedApprovedInternals = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedApprovedInternals.push(key);
                    });
                    return _.filter(bulkWob, function (approvedInternal) {
                        return (failedApprovedInternals.indexOf(approvedInternal) > -1);
                    });
                });
        };

        /**
         * @description Un-star bulk approved internal
         * @param approvedInternals
         */
        self.unStarBulkApprovedInternals = function (approvedInternals) {
            var bulkWob = approvedInternals[0].hasOwnProperty('generalStepElm')
                ? (approvedInternals[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(approvedInternals, 'generalStepElm.workObjectNumber') : approvedInternals)
                : (approvedInternals[0].hasOwnProperty('workObjectNumber') ? _.map(approvedInternals, 'workObjectNumber') : approvedInternals);
            return $http
                .put(urlService.approvedInternal + '/un-star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedApprovedInternals = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedApprovedInternals.push(key);
                    });
                    return _.filter(bulkWob, function (approvedInternal) {
                        return (failedApprovedInternals.indexOf(approvedInternal) > -1);
                    });
                });
        };

        /**
         * @description Terminate approved internal item
         * @param {WorkItem} approvedInternal
         * @param reason
         */
        self.terminateApprovedInternal = function (approvedInternal, reason) {
            var info = approvedInternal.getInfo();
            return $http
                .put(urlService.approvedInternalActions + "/" + info.documentClass + "/terminate/wob-num", {
                    first: info.wobNumber,
                    second: reason
                })
                .then(function (result) {
                    return approvedInternal;
                });
        };

        /**
         * @description Terminate bulk approved internal items
         * @param workItems
         */
        self.terminateBulkApprovedInternals = function (workItems) {
           /* var bulkApprovedInternals = approvedInternals[0].hasOwnProperty('generalStepElm')
                ? (approvedInternals[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(approvedInternals, 'generalStepElm.workObjectNumber') : approvedInternals)
                : (approvedInternals[0].hasOwnProperty('workObjectNumber') ? _.map(approvedInternals, 'workObjectNumber') : approvedInternals);*/

            var items = _.map(workItems, function (workItem) {
                return {
                    first: workItem.getWobNumber(),
                    second: workItem.reason
                };
            });

            var wfName = "internal";

            return $http
                .put((urlService.approvedInternalActions + "/" + wfName.toLowerCase() + "/terminate/bulk"), items)
                .then(function (result) {
                    result = result.data.rs;
                    var failedApprovedInternals = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedApprovedInternals.push(key);
                    });
                    return _.filter(workItems, function (approvedInternal) {
                        return (failedApprovedInternals.indexOf(approvedInternal.generalStepElm.workObjectNumber) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param approvedInternal
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateApprovedInternal = function (approvedInternal, editMode) {
            var approvedInternalsToFilter = self.approvedInternals;
            if (editMode) {
                approvedInternalsToFilter = _.filter(approvedInternalsToFilter, function (approvedInternalToFilter) {
                    return approvedInternalToFilter.id !== approvedInternal.id;
                });
            }
            return _.some(_.map(approvedInternalsToFilter, function (existingApprovedInternal) {
                return existingApprovedInternal.arName === approvedInternal.arName
                    || existingApprovedInternal.enName.toLowerCase() === approvedInternal.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteApprovedInternal, self.updateApprovedInternal);
    });
};
