module.exports = function (app) {
    app.service('returnedDepartmentInboxService', function (urlService,
                                                            $http,
                                                            $q,
                                                            generator,
                                                            WorkItem,
                                                            _,
                                                            dialog,
                                                            correspondenceService,
                                                            langService,
                                                            toast,
                                                            $timeout,
                                                            tokenService,
                                                            cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'returnedDepartmentInboxService';

        self.returnedDepartmentInboxes = [];

        /**
         * @description Load the returned department inbox items from server.
         * @param ignoreTokenRefresh
         * @returns {Promise|returnedDepartmentInboxes}
         */
        self.loadReturnedDepartmentInboxes = function (ignoreTokenRefresh) {
            var params = {};
            if (ignoreTokenRefresh) {
                params.ignoreTokenRefresh = true;
            }
            return $http.get(urlService.departmentInboxes + '/returned', {
                params: params
            }).then(function (result) {
                self.returnedDepartmentInboxes = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                self.returnedDepartmentInboxes = generator.interceptReceivedCollection('WorkItem', self.returnedDepartmentInboxes);
                return self.returnedDepartmentInboxes;
            });
        };

        /**
         * @description Get returned department inbox items from self.returnedDepartmentInboxes if found and if not load it from server again.
         * @returns {Promise|returnedDepartmentInboxes}
         */
        self.getReturnedDepartmentInboxes = function () {
            return self.returnedDepartmentInboxes.length ? $q.when(self.returnedDepartmentInboxes) : self.loadReturnedDepartmentInboxes();
        };

        /**
         * @description Contains methods for operations for returned department inbox items
         */
        self.controllerMethod = {
            /**
             * @description Star returned department inbox item
             * @param returnedDepartmentInbox
             * @param $event
             */
            returnedDepartmentInboxStar: function (returnedDepartmentInbox, $event) {
                return self.starReturnedDepartmentInbox(returnedDepartmentInbox)
                    .then(function (result) {
                        //toast.success(langService.get("star_specific_success").change({name: returnedDepartmentInbox.docSubject}));
                        return result;
                    })
            },
            /**
             * @description Star bulk returned department inbox items
             * @param returnedDepartmentInboxes
             * @param $event
             */
            returnedDepartmentInboxesStarBulk: function (returnedDepartmentInboxes, $event) {
                return self.starBulkReturnedDepartmentInboxes(returnedDepartmentInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === returnedDepartmentInboxes.length) {
                            toast.error(langService.get("failed_star_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('star_success_except_following', _.map(result, function (returnedDepartmentInbox) {
                                return returnedDepartmentInbox.getTranslatedName();
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
             * @description UnStar returned department inbox item
             * @param returnedDepartmentInbox
             * @param $event
             */
            returnedDepartmentInboxUnStar: function (returnedDepartmentInbox, $event) {
                return self.unStarReturnedDepartmentInbox(returnedDepartmentInbox)
                    .then(function (result) {
                        //toast.success(langService.get("unstar_specific_success").change({name: returnedDepartmentInbox.docSubject}));
                        return result;
                    })
            },
            /**
             * @description UnStar bulk returned department inbox items
             * @param returnedDepartmentInboxes
             * @param $event
             */
            returnedDepartmentInboxesUnStarBulk: function (returnedDepartmentInboxes, $event) {
                return self.unStarBulkReturnedDepartmentInboxes(returnedDepartmentInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === returnedDepartmentInboxes.length) {
                            toast.error(langService.get("failed_unstar_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('unstar_success_except_following', _.map(result, function (returnedDepartmentInbox) {
                                return returnedDepartmentInbox.getTranslatedName();
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
             * @description UnStar bulk returned department inbox items
             * @param returnedDepartmentInboxes
             * @param $event
             */
            resendBulk: function (returnedDepartmentInboxes, $event) {
                return correspondenceService
                    .openExportBulkCorrespondenceDialog(returnedDepartmentInboxes, $event, true);
            }
        };


        /**
         * @description Get returned department inbox item by returnedDepartmentInboxId
         * @param returnedDepartmentInbox
         * @returns {ReturnedDepartmentInbox|undefined} return ReturnedDepartmentInbox Model or undefined if not found.
         */
        self.getReturnedDepartmentInboxById = function (returnedDepartmentInbox) {
            var returnedDepartmentInboxId = returnedDepartmentInbox.hasOwnProperty('id') ? returnedDepartmentInbox.id : returnedDepartmentInbox;
            return _.find(self.returnedDepartmentInboxes, function (returnedDepartmentInbox) {
                return Number(returnedDepartmentInbox.id) === Number(returnedDepartmentInboxId);
            });
        };


        /**
         * @description Star returned department inbox item
         * @param returnedDepartmentInbox
         */
        self.starReturnedDepartmentInbox = function (returnedDepartmentInbox) {
            var wob = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(returnedDepartmentInbox.generalStepElm.workObjectNumber) : JSON.parse(returnedDepartmentInbox.generalStepElm))
                : (returnedDepartmentInbox.hasOwnProperty('workObjectNumber') ? new Array(returnedDepartmentInbox.workObjectNumber) : JSON.parse(returnedDepartmentInbox));

            return $http
                .put(urlService.departmentInboxes + '/star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description UnStar returned department inbox item
         * @param returnedDepartmentInbox
         */
        self.unStarReturnedDepartmentInbox = function (returnedDepartmentInbox) {
            var wob = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(returnedDepartmentInbox.generalStepElm.workObjectNumber) : new Array(returnedDepartmentInbox.generalStepElm))
                : (returnedDepartmentInbox.hasOwnProperty('workObjectNumber') ? new Array(returnedDepartmentInbox.workObjectNumber) : new Array(returnedDepartmentInbox));
            return $http
                .put(urlService.departmentInboxes + '/un-star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description Star bulk returned department inbox items
         * @param returnedDepartmentInboxes
         */
        self.starBulkReturnedDepartmentInboxes = function (returnedDepartmentInboxes) {
            var bulkWob = returnedDepartmentInboxes[0].hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(returnedDepartmentInboxes, 'generalStepElm.workObjectNumber') : returnedDepartmentInboxes)
                : (returnedDepartmentInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(returnedDepartmentInboxes, 'workObjectNumber') : returnedDepartmentInboxes);
            return $http
                .put(urlService.departmentInboxes + '/star', bulkWob)
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
         * @description Un-star bulk returned department inbox items
         * @param returnedDepartmentInboxes
         */
        self.unStarBulkReturnedDepartmentInboxes = function (returnedDepartmentInboxes) {
            var bulkWob = returnedDepartmentInboxes[0].hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(returnedDepartmentInboxes, 'generalStepElm.workObjectNumber') : returnedDepartmentInboxes)
                : (returnedDepartmentInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(returnedDepartmentInboxes, 'workObjectNumber') : returnedDepartmentInboxes);
            return $http
                .put(urlService.departmentInboxes + '/un-star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReturnedDepartmentInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReturnedDepartmentInboxes.push(key);
                    });
                    return _.filter(bulkWob, function (userInbox) {
                        return (failedReturnedDepartmentInboxes.indexOf(userInbox) > -1);
                    });
                });
        };

        /**
         * @description Terminate returned department inbox item
         * @param {WorkItem} returnedDepartmentInbox
         */
        self.terminateReturnedDepartmentInbox = function (returnedDepartmentInbox, reason) {
            var won = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? returnedDepartmentInbox.generalStepElm.workObjectNumber : returnedDepartmentInbox.generalStepElm)
                : (returnedDepartmentInbox.hasOwnProperty('workObjectNumber') ? returnedDepartmentInbox.workObjectNumber : returnedDepartmentInbox);

            var wfName = returnedDepartmentInbox.getInfo().documentClass;

            return $http
                .put(urlService.departmentInboxActions + "/" + wfName.toLowerCase() + "/terminate/wob-num", {
                    first: won,
                    second: reason
                })
                .then(function (result) {
                    return returnedDepartmentInbox;
                });


            /*var workObjectNumber = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? returnedDepartmentInbox.generalStepElm.workObjectNumber : returnedDepartmentInbox.generalStepElm)
                : (returnedDepartmentInbox.hasOwnProperty('workObjectNumber') ? returnedDepartmentInbox.workObjectNumber : returnedDepartmentInbox);
            /!*var wfName = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
             ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('workFlowName') ? returnedDepartmentInbox.generalStepElm.workFlowName : returnedDepartmentInbox.generalStepElm)
             : (returnedDepartmentInbox.hasOwnProperty('workFlowName') ? returnedDepartmentInbox.workFlowName : returnedDepartmentInbox);*!/

            //var wfName = "outgoing";

            return $http
                .put(urlService.departmentInboxes + "/terminate/wob-num/" + workObjectNumber)
                .then(function (result) {
                    return returnedDepartmentInbox;
                });*/
        };

        self.resendReturnedDepartmentInbox = function (returnedDepartmentInbox) {
            var info = returnedDepartmentInbox.getInfo();
            return $http
                .put(urlService.departmentInboxes + "/" + info.vsId + "/resend/" + info.wobNumber)
                .then(function (result) {
                    return returnedDepartmentInbox;
                });
        };

        /**
         * @description Resend bulk returned department inbox items
         * @param returnedDepartmentInboxes
         */
        self.resendBulkReturnedDepartmentInboxes = function (returnedDepartmentInboxes) {
            var pairToResend = _.map(returnedDepartmentInboxes, function (returnedDepartmentInbox) {
                var info = returnedDepartmentInbox.getInfo();
                return {
                    first: info.wobNumber,
                    second: info.vsId
                }
            });
            return $http
                .put(urlService.departmentInboxes + '/resend/bulk', pairToResend)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReturnedDepartmentInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReturnedDepartmentInboxes.push(key);
                    });
                    return _.filter(pairToResend, function (pair) {
                        return (failedReturnedDepartmentInboxes.indexOf(pair.second) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param returnedDepartmentInbox
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReturnedDepartmentInbox = function (returnedDepartmentInbox, editMode) {
            var returnedDepartmentInboxesToFilter = self.returnedDepartmentInboxes;
            if (editMode) {
                returnedDepartmentInboxesToFilter = _.filter(returnedDepartmentInboxesToFilter, function (returnedDepartmentInboxToFilter) {
                    return returnedDepartmentInboxToFilter.id !== returnedDepartmentInbox.id;
                });
            }
            return _.some(_.map(returnedDepartmentInboxesToFilter, function (existingReturnedDepartmentInbox) {
                return existingReturnedDepartmentInbox.arName === returnedDepartmentInbox.arName
                    || existingReturnedDepartmentInbox.enName.toLowerCase() === returnedDepartmentInbox.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReturnedDepartmentInbox, self.updateReturnedDepartmentInbox);
    });
};
