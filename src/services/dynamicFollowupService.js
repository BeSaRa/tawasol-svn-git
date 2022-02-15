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
                                                    _) {
            var self = this;
            self.serviceName = 'dynamicFollowupService';

            self.dynamicFollowups = [];

            self.loadDynamicFollowUpsByOu = function (organization) {
                return $http.get(urlService.dynamicFollowup + '/ou/' + organization.id)
                    .then(result => {
                        self.dynamicFollowups = generator.interceptReceivedCollection('DynamicFollowup', generator.generateCollection(result.data.rs, DynamicFollowup));
                        return self.dynamicFollowups;
                    })
            }

            self.controllerMethod = {
                dynamicFollowUpAdd: function (organization, $event) {
                    var ouId = organization.hasOwnProperty('id') ? organization.id : organization;
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            templateUrl: cmsTemplate.getPopup('dynamic-followup'),
                            controller: 'dynamicFollowupPopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                editMode: false,
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
                dynamicFollowUpEdit: function (dynamicFollowUp, organization, $event) {
                    var ouId = organization.hasOwnProperty('id') ? organization.id : organization;
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            templateUrl: cmsTemplate.getPopup('dynamic-followup'),
                            controller: 'dynamicFollowupPopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                editMode: true,
                                dynamicFollowup: dynamicFollowUp
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

            self.loadParticipantUsers = function (organization) {
                var ouId = organization.hasOwnProperty('id') ? organization.getRegistryOUID() : organization;
                return $http.get(urlService.dynamicFollowupUsers.change({ouId: ouId}))
                    .then(result => {
                        return _.map(result.data.rs, function (user) {
                            user.userInfo = generator.generateInstance(user.userInfo, Information);
                            return user
                        });
                    })
            }

            self.deleteDynamicFollowup = function (dynamicFollowupId) {
                dynamicFollowupId = dynamicFollowupId instanceof DynamicFollowup ? dynamicFollowupId.id : dynamicFollowupId;
                return $http.delete((urlService.dynamicFollowup + '/' + dynamicFollowupId));
            }


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
        }
    );
};
