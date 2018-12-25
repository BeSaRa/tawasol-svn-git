module.exports = function (app) {
    app.controller('privateAnnouncementPopCtrl', function (privateAnnouncementService,
                                                           _,
                                                           employeeService,
                                                           editMode,
                                                           toast,
                                                           PrivateAnnouncement,
                                                           validationService,
                                                           generator,
                                                           dialog,
                                                           langService,
                                                           privateAnnouncement,
                                                           moment,
                                                           organizations,
                                                           organizationsHasRegistry) {
        'ngInject';
        var self = this;
        self.controllerName = 'privateAnnouncementPopCtrl';
        self.editMode = editMode;
        self.privateAnnouncement = angular.copy(privateAnnouncement);
        self.model = angular.copy(privateAnnouncement);
        var hasCurrentOu = self.editMode ? _checkCurrentOu(self.model) : false;
        self.organizations = organizations;
        self.organizationsHasRegistry = organizationsHasRegistry;

        var today = new Date();
        self.currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        self.alwaysActive = false;
        if (self.editMode) {
            self.alwaysActive = !(self.model.startDate && self.model.endDate);
            self.isStatusDisabled = moment(self.model.endDate, "YYYY-MM-DD").valueOf() < moment(self.currentDate, "YYYY-MM-DD").valueOf();
        }

        function _checkCurrentOu(model) {
            var ouId = employeeService.getEmployee().organization.ouid;
            return _.some(model.subscribers, function (item) {
                return item.ouId === ouId && !item.announcementType;
            });
        }

        self.validateLabels = {
            arSubject: 'arabic_subject',
            enSubject: 'english_subject_name',
            arBody: 'arabic_body_text',
            enBody: 'english_body_text',
            itemOrder: 'item_order',
            status: 'status'
        };

        /**
         * @description Add new private announcement
         */
        self.addPrivateAnnouncementFromCtrl = function () {
            validationService
                .createValidation('ADD_PRIVATE_ANNOUNCEMENT')
                .addStep('check_required', true, generator.checkRequiredFields, self.privateAnnouncement, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_subscribers_exist', true, privateAnnouncementService.checkDuplicatePrivateAnnouncement, [self.privateAnnouncement, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_duplicate', true, privateAnnouncementService.checkDuplicatePrivateAnnouncement, [self.privateAnnouncement, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_start_date', true, self.checkStartDate, self.privateAnnouncement, function (result) {
                    return result;
                })
                .notifyFailure(function (step, result) {
                    toast.error(langService.get('max_current_date').change({today: generator.convertDateToString(self.currentDate)}));
                })
                .validate()
                .then(function () {
                    if (self.alwaysActive) {
                        self.privateAnnouncement.startDate = null;
                        self.privateAnnouncement.endDate = null;
                    }
                    privateAnnouncementService.addPrivateAnnouncement(self.privateAnnouncement).then(function () {
                        if (_checkCurrentOu(self.privateAnnouncement)) {
                            privateAnnouncementService.getPrivateAnnouncementByOUID();
                        }
                        toast.success(langService.get('add_success').change({name: self.privateAnnouncement.getNames()}));
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit private announcement
         */
        self.editPrivateAnnouncementFromCtrl = function () {
            validationService
                .createValidation('EDIT_PRIVATE_ANNOUNCEMENT')
                .addStep('check_required', true, generator.checkRequiredFields, self.privateAnnouncement, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, privateAnnouncementService.checkDuplicatePrivateAnnouncement, [self.privateAnnouncement, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_start_date', true, self.checkStartDate, self.privateAnnouncement, function (result) {
                    return result;
                })
                .notifyFailure(function (step, result) {
                    toast.error(langService.get('max_current_date').change({today: generator.convertDateToString(self.currentDate)}));
                })
                .validate()
                .then(function () {
                    if (self.alwaysActive) {
                        self.privateAnnouncement.startDate = null;
                        self.privateAnnouncement.endDate = null;
                    }
                    privateAnnouncementService.updatePrivateAnnouncement(self.privateAnnouncement).then(function () {
                        toast.success(langService.get('edit_success').change({name: self.privateAnnouncement.getNames()}));
                        if (hasCurrentOu && !_checkCurrentOu(self.privateAnnouncement)) {
                            privateAnnouncementService.getPrivateAnnouncementByOUID();
                        }

                        if (!hasCurrentOu && _checkCurrentOu(self.privateAnnouncement)) {
                            privateAnnouncementService.getPrivateAnnouncementByOUID();
                        }
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        /**
         * @description check if start date greater or equal than today
         * @param announcement
         * @returns {boolean}
         */
        self.checkStartDate = function (announcement) {
            if (self.alwaysActive)
                return true;
            return moment(announcement.startDate, "YYYY-MM-DD").valueOf() >= moment(self.currentDate, "YYYY-MM-DD").valueOf();
        };

        /**
         * @description Close the popup
         */
        self.closePrivateAnnouncementPopupFromCtrl = function () {
            dialog.cancel();
        };

        self.subOU = false;
        self.includedOrganization = null;

        //Include organization in grid on click of Add button after selecting organization from select dropdown
        self.includeSelectedOrganization = function () {
            var getOrganization = self.organizations.filter(function (organization) {
                return organization.id === self.includedOrganization;
            })[0];

            //check if org unit already exist in grid or not so that user cannot add again
            var organizationExist = self.privateAnnouncement.subscribers.filter(function (organization) {
                return organization.ouId === getOrganization.id;
            })[0];

            //if org unit do not exist in grid then add
            if (!organizationExist) {
                self.privateAnnouncement.subscribers.push({
                    "announcementType": 0,
                    "ouId": getOrganization.id,
                    "withSubOus": self.subOU
                });
            }
            self.includedOrganization = null;
            self.subOU = false;
        };

        self.removeIncludedOrganization = function (organization) {
            dialog.confirmMessage((langService.get('confirm_delete_msg'))).then(function () {

                var indexOfSubOrganization = _.findIndex(self.privateAnnouncement.subscribers, function (x) {
                    return x.ouId === organization.ouId;
                });
                self.privateAnnouncement.subscribers.splice(indexOfSubOrganization, 1);

                //remove sub org units for parent record if any
                var getSubOrgUnitsToDelete = [];
                getSubOrgUnitsToDelete = self.getChildren(organization.ouId);
                for (var i = 0; i < getSubOrgUnitsToDelete.length; i++) {
                    var indexOfSubOrganization = _.findIndex(self.privateAnnouncement.subscribers, function (x) {
                        return (x.ouId === getSubOrgUnitsToDelete[i].id) && (x.announcementType === 1);
                    });
                    if (indexOfSubOrganization !== -1)
                        self.privateAnnouncement.subscribers.splice(indexOfSubOrganization, 1);
                }
            }, function () {

            })
        };

        //get sub org unit records for parent org unit and return collection
        self.getChildren = function (id) {
            var children = [];
            for (var i = 0; i < self.organizations.length; i++) {
                if (self.organizations[i].parent === id) {
                    children.push(self.organizations[i]);
                    self.getChildren(self.organizations[i].id);
                }
            }
            return children;
        };

        self.getOrganizationARName = function (ouId) {
            return self.organizations.filter(function (organization) {
                return organization.id === ouId;
            })[0]["arName"];
        };

        self.getOrganizationENName = function (ouId) {
            return self.organizations.filter(function (organization) {
                return organization.id === ouId;
            })[0]["enName"];
        };

        /**
         * @description Opens dialog for add new private announcement
         * @param selectedOUId
         * @param $event
         */
        self.openExcludeOrganizationDialog = function (selectedOUId, $event) {
            var selectedOrganizationToExclude = [];
            var getSubOrgUnits = self.getChildren(selectedOUId);

            for (var i = 0; i < self.privateAnnouncement.subscribers.length; i++) {
                var orgUnitsToExclude = getSubOrgUnits.filter(function (subscriber) {
                    return (self.privateAnnouncement.subscribers[i].ouId === subscriber.id) && (self.privateAnnouncement.subscribers[i].announcementType === 1);
                })[0];
                if (orgUnitsToExclude) {
                    selectedOrganizationToExclude.push(orgUnitsToExclude);//add sub org units in new list to bind with excluded records grid and pass in locals when opening excluded grid popup
                }
            }

            privateAnnouncementService
                .controllerMethod
                .privateAnnouncementExcludeOrganization(getSubOrgUnits, selectedOrganizationToExclude, $event)
                .then(function (result) {
                    var isSubscriberExist, indexOfSubOrgUnit;
                    //result has all the selected records from excluded org units grid
                    for (var index = 0; index < result.length; index++) {

                        //check if excluded record already exist in main list which will be sent to API (self.privateAnnouncement.subscribers)
                        isSubscriberExist = self.privateAnnouncement.subscribers.filter(function (subscriber) {
                            return result[index].id === subscriber.ouId;
                        })[0];

                        if (isSubscriberExist) {
                            //if record exist in main list(self.privateAnnouncement.subscribers) and announcementType == 0, then remove from main list and add again with announcementType == 1 so it will be excluded from Included organization list automatically
                            if (isSubscriberExist.announcementType === 0) {
                                indexOfSubOrgUnit = _.findIndex(self.privateAnnouncement.subscribers, function (x) {
                                    return x.ouId === isSubscriberExist.ouId;
                                });
                                self.privateAnnouncement.subscribers.splice(indexOfSubOrgUnit, 1);

                                self.privateAnnouncement.subscribers.push({
                                    "updatedBy": null,
                                    "updatedOn": null,
                                    "clientData": null,
                                    "ouId": result[index].id,
                                    "announcementType": 1,
                                    "withSubOus": false
                                });
                            }
                        } else {
                            //if record do not exist in main list then add new excluded org unit (main list will not have record for included or excluded org unit)
                            self.privateAnnouncement.subscribers.push({
                                "updatedBy": null,
                                "updatedOn": null,
                                "clientData": null,
                                "ouId": result[index].id,
                                "announcementType": 1,
                                "withSubOus": false
                            });
                        }
                    }

                    //loop all the child org units for parent org unit to check if record do not exist in new selected Excluded org unit list (result) then remove from main list
                    for (var j = 0; j < getSubOrgUnits.length; j++) {
                        isSubscriberExist = self.privateAnnouncement.subscribers.filter(function (subscriber) {
                            return (getSubOrgUnits[j].id === subscriber.ouId) && (subscriber.announcementType === 1);
                        })[0];

                        if (isSubscriberExist) {
                            var isSubscriberExistInSelectedOrgUnits = result.filter(function (selectedOrgUnit) {
                                return isSubscriberExist.ouId === selectedOrgUnit.id;
                            })[0];

                            if (!isSubscriberExistInSelectedOrgUnits) {
                                indexOfSubOrgUnit = _.findIndex(self.privateAnnouncement.subscribers, function (x) {
                                    return x.ouId === isSubscriberExist.ouId;
                                });
                                self.privateAnnouncement.subscribers.splice(indexOfSubOrgUnit, 1);
                            }
                        }
                    }

                })
        };

        /**
         * @description to disable status switch if end date < current date
         * @param privateAnnouncement
         * @returns {boolean}
         */
        self.disableStatus = function (privateAnnouncement) {
            if (privateAnnouncement.endDate)
                return moment(privateAnnouncement.endDate, "YYYY-MM-DD").valueOf() < moment(self.currentDate, "YYYY-MM-DD").valueOf();
            else
                return false;
        };

        self.onAlwaysActiveChange = function () {
            if (self.alwaysActive) {
                self.privateAnnouncement.startDate = null;
                self.privateAnnouncement.endDate = null;

            }
        };

        self.setMinEndDate = function () {
            if (self.privateAnnouncement.startDate) {
                var endDate = angular.copy(self.privateAnnouncement.startDate);
                self.minEndDate = new Date(endDate.setDate(endDate.getDate() + 1));
            }
            else {
                self.privateAnnouncement.endDate = null;
                self.minEndDate = null;
            }
        };
        self.setMinEndDate();

        self.isOuNotIncluded = function (ou) {
            return (_.findIndex(self.privateAnnouncement.subscribers, function (subscriber) {
                return subscriber.ouId === ou.id;
            }) < 0);
        }


    });
};