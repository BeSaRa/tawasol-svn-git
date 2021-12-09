module.exports = function (app) {
    app.service('proxyMailInboxService', function (urlService,
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
                                                   ProxyMailUser,
                                                   listGeneratorService,
                                                   $window) {
        'ngInject';
        var self = this;
        self.serviceName = 'proxyMailInboxService';

        self.proxyMailInboxes = [];
        self.proxyMailUsers = [];

        self.currentUser = employeeService.getEmployee();

        /**
         * @description Load the Proxy mail inboxes from server.
         * @returns {Promise|proxyMailInboxes}
         */
        self.loadProxyMailInboxes = function (userId, ouId) {
            //return $http.get(urlService.proxyMailInbox + userId).then(function (result) {
            return $http.get(urlService.userInbox + "/proxy/user-id/" + userId + "/ou/" + ouId).then(function (result) {
                self.proxyMailInboxes = [];
                if (result.data.rs) {
                    self.proxyMailInboxes = generator.generateCollection(result.data.rs, WorkItem, self._sharedMethods);
                    self.proxyMailInboxes = generator.interceptReceivedCollection('WorkItem', self.proxyMailInboxes);
                }
                return self.proxyMailInboxes;
                //return _.sortBy(self.proxyMailInboxes, 'generalStepElm.starred').reverse();
            }).catch(function (e) {
                return [];
            });
        };

        /**
         * @description get all proxy users for current user
         */
        self.getProxyMailUsers = function () {
            return $http.get(urlService.userInbox + "/proxy-info/" + self.currentUser.id).then(function (result) {
                self.proxyMailUsers = generator.generateCollection(result.data.rs, ProxyMailUser, self._sharedMethods);
                //self.proxyMailInboxes = generator.interceptReceivedCollection('WorkItem', self.proxyMailInboxes);

                //console.log(self.proxyMailUsers);
                return self.proxyMailUsers;
            });
        };

        /**
         * @description Get Proxy mail inboxes from self.proxyMailInboxes if found and if not load it from server again.
         * @param userId
         * @param ouId
         * @returns {Promise|proxyMailInboxes}
         */
        self.getProxyMailInboxes = function (userId, ouId) {
            return self.proxyMailInboxes.length ? $q.when(self.proxyMailInboxes) : self.loadProxyMailInboxes(userId, ouId);
        };

        /**
         * @description Contains methods for operations for proxy mail inbox items
         */
        self.controllerMethod = {
            /**
             * @description Star proxy mail inbox
             * @param proxyMailInbox
             * @param $event
             */
            proxyMailInboxStar: function (proxyMailInbox, $event) {
                return self.starProxyMailInbox(proxyMailInbox)
                    .then(function (result) {
                        return result;
                    })
            },
            /**
             * @description Star bulk proxy mail inbox items
             * @param proxyMailInboxes
             * @param $event
             */
            proxyMailInboxStarBulk: function (proxyMailInboxes, $event) {
                return self.starBulkProxyMailInboxes(proxyMailInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === proxyMailInboxes.length) {
                            toast.error(langService.get("failed_star_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('star_success_except_following', _.map(result, function (proxyMailInbox) {
                                return proxyMailInbox.getTranslatedName();
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
             * @description UnStar proxy mail inbox
             * @param proxyMailInbox
             * @param $event
             */
            proxyMailInboxUnStar: function (proxyMailInbox, $event) {
                return self.unStarProxyMailInbox(proxyMailInbox)
                    .then(function (result) {
                        return result;
                    })
            },
            /**
             * @description UnStar bulk proxy mail inbox items
             * @param proxyMailInboxes
             * @param $event
             */
            proxyMailInboxUnStarBulk: function (proxyMailInboxes, $event) {
                return self.unStarBulkProxyMailInboxes(proxyMailInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === proxyMailInboxes.length) {
                            toast.error(langService.get("failed_unstar_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('unstar_success_except_following', _.map(result, function (proxyMailInbox) {
                                return proxyMailInbox.getTranslatedName();
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
             * @description Terminate proxy mail inbox
             * @param proxyMailInbox
             * @param $event
             */
            proxyMailInboxTerminate: function (proxyMailInbox, $event) {
                return self.terminateProxyMailInbox(proxyMailInbox)
                    .then(function (result) {
                        return true;
                    })
            },
            /**
             * @description Terminate bulk proxy mail inbox items
             * @param proxyMailInboxes
             * @param $event
             */
            proxyMailInboxTerminateBulk: function (proxyMailInboxes, $event) {
                return self.terminateBulkProxyMailInboxes(proxyMailInboxes)
                    .then(function (result) {
                        var response = false;
                        if (result.length === proxyMailInboxes.length) {
                            toast.error(langService.get("failed_terminate_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('following_records_failed_to_terminate', _.map(result, function (proxyMailInbox) {
                                return proxyMailInbox.getTranslatedName();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_terminate_success"));
                            response = true;
                        }
                        return response;
                    });
            },

            /**
             * @description Opens the popup to select signature
             * @param proxyMailInbox
             * @param $event
             * @returns {promise}
             */
            proxyMailInboxSignaturePopup: function (proxyMailInbox, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('signature'),
                        controller: 'signaturePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            userInbox: proxyMailInbox
                        },
                        resolve: {
                            signatures: function (applicationUserSignatureService, $q) {
                                'ngInject';
                                if (self.currentUser.hasOwnProperty('signature') && self.currentUser.signature.length)
                                    return $q.when(self.currentUser.signature);

                                return applicationUserSignatureService.loadApplicationUserSignatures(self.currentUser.id).then(function (result) {
                                    self.currentUser.signature = result;
                                    return result;
                                });
                            }
                        }
                    });
            }
        };

        /**
         * @description Get proxy mail inbox by proxyMailInboxId
         * @param proxyMailInboxId
         * @returns {WorkItem|undefined} return WorkItem Model or undefined if not found.
         */
        self.getProxyMailInboxById = function (proxyMailInboxId) {
            proxyMailInboxId = proxyMailInboxId instanceof WorkItem ? proxyMailInboxId.id : proxyMailInboxId;
            return _.find(self.proxyMailInboxes, function (proxyMailInbox) {
                return Number(proxyMailInbox.id) === Number(proxyMailInboxId);
            });
        };

        /**
         * @description Star proxy mail inbox item
         * @param proxyMailInbox
         */
        self.starProxyMailInbox = function (proxyMailInbox) {
            var wob = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(proxyMailInbox.generalStepElm.workObjectNumber) : JSON.parse(proxyMailInbox.generalStepElm))
                : (proxyMailInbox.hasOwnProperty('workObjectNumber') ? new Array(proxyMailInbox.workObjectNumber) : JSON.parse(proxyMailInbox));
            return $http
                .put(urlService.userInbox + '/star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description UnStar proxy mail inbox item
         * @param proxyMailInbox
         */
        self.unStarProxyMailInbox = function (proxyMailInbox) {
            var wob = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? new Array(proxyMailInbox.generalStepElm.workObjectNumber) : new Array(proxyMailInbox.generalStepElm))
                : (proxyMailInbox.hasOwnProperty('workObjectNumber') ? new Array(proxyMailInbox.workObjectNumber) : new Array(proxyMailInbox));
            return $http
                .put(urlService.userInbox + '/un-star', wob)
                .then(function (result) {
                    return result.data.rs[wob];
                });
        };

        /**
         * @description Star bulk proxy mail inbox items
         * @param proxyMailInboxes
         */
        self.starBulkProxyMailInboxes = function (proxyMailInboxes) {
            var bulkWob = proxyMailInboxes[0].hasOwnProperty('generalStepElm')
                ? (proxyMailInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(proxyMailInboxes, 'generalStepElm.workObjectNumber') : proxyMailInboxes)
                : (proxyMailInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(proxyMailInboxes, 'workObjectNumber') : proxyMailInboxes);
            return $http
                .put(urlService.userInbox + '/star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedProxyMailInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedProxyMailInboxes.push(key);
                    });
                    return _.filter(bulkWob, function (proxyMailInbox) {
                        return (failedProxyMailInboxes.indexOf(proxyMailInbox) > -1);
                    });
                });
        };

        /**
         * @description Un-star bulk proxy mail inbox
         * @param proxyMailInboxes
         */
        self.unStarBulkProxyMailInboxes = function (proxyMailInboxes) {
            var bulkWob = proxyMailInboxes[0].hasOwnProperty('generalStepElm')
                ? (proxyMailInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(proxyMailInboxes, 'generalStepElm.workObjectNumber') : proxyMailInboxes)
                : (proxyMailInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(proxyMailInboxes, 'workObjectNumber') : proxyMailInboxes);
            return $http
                .put(urlService.userInbox + '/un-star', bulkWob)
                .then(function (result) {
                    result = result.data.rs;
                    var failedProxyMailInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedProxyMailInboxes.push(key);
                    });
                    return _.filter(bulkWob, function (proxyMailInbox) {
                        return (failedProxyMailInboxes.indexOf(proxyMailInbox) > -1);
                    });
                });
        };

        /**
         * @description Terminate proxy mail inbox item
         * @param {WorkItem} proxyMailInbox
         */
        self.terminateProxyMailInbox = function (proxyMailInbox) {
            var won = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('workObjectNumber') ? proxyMailInbox.generalStepElm.workObjectNumber : proxyMailInbox.generalStepElm)
                : (proxyMailInbox.hasOwnProperty('workObjectNumber') ? proxyMailInbox.workObjectNumber : proxyMailInbox);
            /* var wfName = proxyMailInbox.hasOwnProperty('generalStepElm')
             ? (proxyMailInbox.generalStepElm.hasOwnProperty('workFlowName') ? proxyMailInbox.generalStepElm.workFlowName : proxyMailInbox.generalStepElm)
             : (proxyMailInbox.hasOwnProperty('workFlowName') ? proxyMailInbox.workFlowName : proxyMailInbox);*/

            var wfName = "outgoing";

            return $http
                .put(urlService.userInboxActions + "/" + wfName.toLowerCase() + "/terminate/" + won)
                .then(function (result) {
                    return proxyMailInbox;
                });
        };

        /**
         * @description Export proxy mail inbox item
         * @param {WorkItem} proxyMailInbox
         */
        self.exportProxyMailInbox = function (proxyMailInbox) {
            var vsId = proxyMailInbox.hasOwnProperty('generalStepElm')
                ? (proxyMailInbox.generalStepElm.hasOwnProperty('vsId') ? proxyMailInbox.generalStepElm.vsId : proxyMailInbox.generalStepElm)
                : (proxyMailInbox.hasOwnProperty('vsId') ? proxyMailInbox.vsId : proxyMailInbox);
            // var wfName = proxyMailInbox.hasOwnProperty('generalStepElm')
            //     ? (proxyMailInbox.generalStepElm.hasOwnProperty('workFlowName') ? proxyMailInbox.generalStepElm.workFlowName : proxyMailInbox.generalStepElm)
            //     : (proxyMailInbox.hasOwnProperty('workFlowName') ? proxyMailInbox.workFlowName : proxyMailInbox);

            var wfName = "outgoing";
            return $http
                .put(urlService.userInboxActions + "/" + wfName.toLowerCase() + "/" + vsId + "/export")
                .then(function (result) {
                    return proxyMailInbox;
                });
        };

        /**
         * @description Terminate bulk proxy mail inbox items
         * @param proxyMailInboxes
         */
        self.terminateBulkProxyMailInboxes = function (proxyMailInboxes) {
            var bulkProxyMailInboxes = proxyMailInboxes[0].hasOwnProperty('generalStepElm')
                ? (proxyMailInboxes[0].generalStepElm.hasOwnProperty('workObjectNumber') ? _.map(proxyMailInboxes, 'generalStepElm.workObjectNumber') : proxyMailInboxes)
                : (proxyMailInboxes[0].hasOwnProperty('workObjectNumber') ? _.map(proxyMailInboxes, 'workObjectNumber') : proxyMailInboxes);

            //var wfName = proxyMailInboxes[0].hasOwnProperty('generalStepElm')
            //    ? (proxyMailInboxes[0].generalStepElm.hasOwnProperty('workFlowName') ? _.map(proxyMailInboxes, 'generalStepElm.workFlowName') : proxyMailInboxes)
            //    : (proxyMailInboxes[0].hasOwnProperty('workFlowName') ? _.map(proxyMailInboxes, 'workFlowName') : proxyMailInboxes);

            var wfName = "outgoing";

            return $http
                .put((urlService.userInboxActions + "/" + wfName.toLowerCase() + "/terminate/bulk"), bulkProxyMailInboxes)
                .then(function (result) {
                    result = result.data.rs;
                    var failedProxyMailInboxes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedProxyMailInboxes.push(key);
                    });
                    return _.filter(proxyMailInboxes, function (proxyMailInbox) {
                        return (failedProxyMailInboxes.indexOf(proxyMailInbox.workObjectNumber) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param proxyMailInbox
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateProxyMailInbox = function (proxyMailInbox, editMode) {
            var proxyMailInboxesToFilter = self.proxyMailInboxes;
            if (editMode) {
                proxyMailInboxesToFilter = _.filter(proxyMailInboxesToFilter, function (proxyMailInboxToFilter) {
                    return proxyMailInboxToFilter.id !== proxyMailInbox.id;
                });
            }
            return _.some(_.map(proxyMailInboxesToFilter, function (existingProxyMailInbox) {
                return existingProxyMailInbox.arName === proxyMailInbox.arName
                    || existingProxyMailInbox.enName.toLowerCase() === proxyMailInbox.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Sign the document
         * @param proxyMailInbox
         * @param signature
         */
        self.signDocument = function (proxyMailInbox, signature) {
            var signatureModel = {
                bookVsid: proxyMailInbox.generalStepElm.vsId,
                signatureVsid: signature.hasOwnProperty('vsId') ? signature.vsId : signature,
                wobNum: proxyMailInbox.generalStepElm.workObjectNumber
            };

            return $http
                .put((urlService.outgoings + '/authorize'), signatureModel)
                .then(function () {
                    return true;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteProxyMailInbox, self.updateProxyMailInbox);
    });
};
