module.exports = function (app) {
    app.service('dynamicFollowupService', function ($http,
                                                    $q,
                                                    urlService,
                                                    employeeService,
                                                    toast,
                                                    generator,
                                                    cmsTemplate,
                                                    dialog,
                                                    DynamicFollowup,
                                                    Information,
                                                    langService,
                                                    _) {
            var self = this;
            self.serviceName = 'dynamicFollowupService';

            self.dynamicFollowups = [];

            self.loadDynamicFollowUpsByOu = function (organization) {
                var id = organization.hasOwnProperty('id') ? organization.id : organization;
                return $http.get(urlService.dynamicFollowup + '/ou/' + id)
                    .then(result => {
                        self.dynamicFollowups = generator.interceptReceivedCollection('DynamicFollowup', generator.generateCollection(result.data.rs, DynamicFollowup));
                        return self.dynamicFollowups;
                    })
            }

            self.controllerMethod = {
                dynamicFollowUpAdd: function (organization, dynamicFollowUps, $event) {
                    var ouId = organization.hasOwnProperty('id') ? organization.id : organization;
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            templateUrl: cmsTemplate.getPopup('dynamic-followup'),
                            controller: 'dynamicFollowupPopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                editMode: false,
                                dynamicFollowUps: dynamicFollowUps,
                                dynamicFollowup: new DynamicFollowup({
                                    ouId: organization.id,
                                    creatorId: employeeService.getEmployee().id
                                })
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.getAllOrganizationsStructure();
                                },
                                applicationUsers: function () {
                                    'ngInject';
                                    return self.loadParticipantUsers(organization);
                                }
                            }
                        });
                },
                dynamicFollowUpEdit: function (dynamicFollowUp, organization, dynamicFollowUps, $event) {
                    var ouId = organization.hasOwnProperty('id') ? organization.id : organization;
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            templateUrl: cmsTemplate.getPopup('dynamic-followup'),
                            controller: 'dynamicFollowupPopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                editMode: true,
                                dynamicFollowUps: dynamicFollowUps,
                                dynamicFollowup: dynamicFollowUp
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.getAllOrganizationsStructure();
                                },
                                applicationUsers: function () {
                                    'ngInject';
                                    return self.loadParticipantUsers(organization, dynamicFollowUp);
                                }
                            }
                        });
                },
                dynamicFollowupDeleteBulk: function (dynamicFollowups, $event) {
                    return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                        .then(function (result) {
                            return self.deleteBulkDynamicFollowup(dynamicFollowups)
                                .then(function (result) {
                                    var response = false;
                                    if (result.length === dynamicFollowups.length) {
                                        toast.error(langService.get("failed_delete_selected"));
                                        response = false;
                                    } else if (result.length) {
                                        generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (dynamicFollowup) {
                                            return dynamicFollowup.getNames();
                                        }));
                                        response = true;
                                    } else {
                                        toast.success(langService.get("delete_success"));
                                        response = true;
                                    }
                                    return response;
                                });
                        });
                }
            }

            /**
             * @description add new dynamic follow up
             * @param dynamicFollowUp
             * @returns {*}
             */
            self.addDynamicFollowUp = function (dynamicFollowUp) {
                return $http
                    .post(urlService.dynamicFollowup,
                        generator.interceptSendInstance('DynamicFollowup', dynamicFollowUp))
                    .then(function (result) {
                        return dynamicFollowUp;
                    });
            }

            /**
             * @description update dynamic follow up
             * @param dynamicFollowUp
             * @returns {*}
             */
            self.updateDynamicFollowUp = function (dynamicFollowUp) {
                return $http
                    .put(urlService.dynamicFollowup,
                        generator.interceptSendInstance('DynamicFollowup', dynamicFollowUp))
                    .then(function (result) {
                        return dynamicFollowUp;
                    });
            }


            /**
             * @description load dynamic followup by dynamic followup id from server
             * @returns {UserFilter|undefined} return UserFilter Model or undefined if not found.
             * @param dynamicFollowupId
             */
            self.loadDynamicFollowUpById = function (dynamicFollowupId) {
                dynamicFollowupId = dynamicFollowupId instanceof DynamicFollowup ? dynamicFollowupId.id : dynamicFollowupId;
                return $http.get(urlService.dynamicFollowup + '/' + dynamicFollowupId)
                    .then(function (result) {
                        result = generator.generateInstance(result.data.rs, DynamicFollowup);
                        result = generator.interceptReceivedInstance('DynamicFollowup', result);
                        var index = _.findIndex(self.dynamicFollowups, function (filter) {
                            return (self.dynamicFollowups.id === filter.id);
                        });
                        self.dynamicFollowups[index] = result;
                        return result;
                    });
            };

            self.loadParticipantUsers = function (organization, dynamicFollowup) {
                var ouId = organization.hasOwnProperty('id') ? organization.getRegistryOUID() : organization;
                return $http.get(urlService.dynamicFollowupUsers.change({ouId: ouId}))
                    .then(result => {
                        return _.map(result.data.rs, function (user) {
                            user.userInfo = generator.generateInstance(user.userInfo, Information);

                            if (dynamicFollowup && dynamicFollowup.participantSet && dynamicFollowup.participantSet.length) {
                                var dynamicFollowupUser = _.find(dynamicFollowup.participantSet, function (item) {
                                    return user.userId === item.userId && user.ouId === item.ouId;
                                });
                                user.participantId = dynamicFollowupUser ? dynamicFollowupUser.participantId : null;
                            }
                            return user
                        });
                    })
            }

            self.deleteDynamicFollowup = function (dynamicFollowupId) {
                dynamicFollowupId = dynamicFollowupId instanceof DynamicFollowup ? dynamicFollowupId.id : dynamicFollowupId;
                return $http.delete((urlService.dynamicFollowup + '/' + dynamicFollowupId));
            }

            /**
             * @description Delete bulk follow ups.
             * @return {Promise|null}
             * @param dynamicFollowups
             */
            self.deleteBulkDynamicFollowup = function (dynamicFollowups) {
                var bulkIds = dynamicFollowups[0].hasOwnProperty('id') ? _.map(dynamicFollowups, 'id') : dynamicFollowups;
                return $http({
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    url: (urlService.dynamicFollowup + '/bulk'),
                    data: bulkIds
                }).then(function (result) {
                    result = result.data.rs;
                    var failedDynamicFollowups = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedDynamicFollowups.push(key);
                    });
                    return _.filter(dynamicFollowups, function (layout) {
                        return (failedDynamicFollowups.indexOf(layout.id) > -1);
                    });
                });
            };


            /**
             * @description activate dynamic follow up
             * @param dynamicFollowup
             */
            self.activateDynamicFollowup = function (dynamicFollowup) {
                return $http
                    .put((urlService.dynamicFollowup + '/activate/' + dynamicFollowup.id))
                    .then(function () {
                        return dynamicFollowup;
                    });
            };

            /**
             * @description Deactivate dynamic follow up
             * @param dynamicFollowup
             */
            self.deactivateDynamicFollowup = function (dynamicFollowup) {
                return $http
                    .put((urlService.dynamicFollowup + '/deactivate/' + dynamicFollowup.id))
                    .then(function () {
                        return dynamicFollowup;
                    });
            };

            /**
             * @description Activate bulk of dynamic follow ups
             * @param dynamicFollowups
             */
            self.activateBulkDynamicFollowups = function (dynamicFollowups) {
                return $http
                    .put((urlService.dynamicFollowup + '/activate/bulk'), _.map(dynamicFollowups, 'id'))
                    .then(function (result) {
                        return generator.getBulkActionResponse(result, dynamicFollowups, false, 'failed_activate_selected', 'success_activate_selected', 'success_activate_selected_except_following');
                    });
            };

            /**
             * @description Deactivate bulk of dynamic follow ups
             * @param dynamicFollowups
             */
            self.deactivateBulkDynamicFollowups = function (dynamicFollowups) {
                return $http
                    .put((urlService.dynamicFollowup + '/deactivate/bulk'), _.map(dynamicFollowups, 'id'))
                    .then(function (result) {
                        return generator.getBulkActionResponse(result, dynamicFollowups, false, 'failed_deactivate_selected', 'success_deactivate_selected', 'success_deactivate_selected_except_following');
                    });
            };


            /**
             * @description Check if record with same name exists. Returns true if exists
             * @param dynamicFollowup
             * @param editMode
             * @returns {boolean}
             */
            self.checkDuplicateDynamicFollowupName = function (dynamicFollowup, editMode) {
                var dynamicFollowupsToFilter = self.dynamicFollowups;
                if (editMode) {
                    dynamicFollowupsToFilter = _.filter(dynamicFollowupsToFilter, function (dynamicFollowupToFilter) {
                        return dynamicFollowupToFilter.id !== dynamicFollowup.id;
                    });
                }
                return _.some(_.map(dynamicFollowupsToFilter, function (existingDynamicFollowup) {
                    return existingDynamicFollowup.arName.toLowerCase() === dynamicFollowup.arName.toLowerCase()
                        || existingDynamicFollowup.enName.toLowerCase() === dynamicFollowup.enName.toLowerCase();
                }), function (matchingResult) {
                    return matchingResult === true;
                });
            };

            /**
             * @description Check if record with same dynamic followup exists. Returns true if exists
             * @param dynamicFollowup
             * @param editMode
             * @returns {boolean}
             */
            self.checkDuplicateDynamicFollowup = function (dynamicFollowup, editMode) {
                var dynamicFollowupsToFilter = self.dynamicFollowups;
                var securityLevels = generator.getResultFromSelectedCollection(dynamicFollowup.securityLevel, 'lookupKey');
                var participantSetIds = _.map(dynamicFollowup.participantSet, 'userId');
                var mainSites = _.map(dynamicFollowup.ui.key_mainSubSites.value, 'mainSiteId');
                var subSites = _.map(dynamicFollowup.ui.key_mainSubSites.value, 'subSiteId');
                if (editMode) {
                    dynamicFollowupsToFilter = _.filter(dynamicFollowupsToFilter, function (dynamicFollowupToFilter) {
                        return dynamicFollowupToFilter.id !== dynamicFollowup.id;
                    });
                }
                return _.some(_.map(dynamicFollowupsToFilter, function (existingDynamicFollowup) {
                    var existingSecurityLevels = generator.getResultFromSelectedCollection(existingDynamicFollowup.securityLevel, 'lookupKey');
                    // check participants
                    var matchParticipantSetIds = _.every(existingDynamicFollowup.participantSet, function (participant) {
                        return participantSetIds.indexOf(participant.userId) !== -1;
                    });
                    //check main sites
                    var existingMainSites = _.map(existingDynamicFollowup.ui.key_mainSubSites.value, 'mainSiteId');
                    var matchMainSites = _.every(existingMainSites, function (site) {
                        return mainSites.indexOf(site) !== -1;
                    });
                    // check sub sites
                    var existingSubSites = _.map(existingDynamicFollowup.ui.key_mainSubSites.value, 'subSiteId');
                    var matchSubSites = _.every(existingSubSites, function (site) {
                        return subSites.indexOf(site) !== -1;
                    });

                    return Number(existingDynamicFollowup.slaDays) === Number(dynamicFollowup.slaDays)
                        && existingDynamicFollowup.docClassId === dynamicFollowup.docClassId
                        && Number(existingSecurityLevels) === Number(securityLevels)
                        && matchParticipantSetIds
                        && matchMainSites && matchSubSites;
                }), function (matchingResult) {
                    return matchingResult === true;
                });
            };
        }
    );
};
