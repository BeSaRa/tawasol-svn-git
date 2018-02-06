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
                .validate()
                .then(function () {
                    if (self.alwaysActive) {
                        self.privateAnnouncement.startDate = null;
                        self.privateAnnouncement.endDate = null;
                    }
                    privateAnnouncementService.addPrivateAnnouncement(self.privateAnnouncement).then(function () {
                        if(_checkCurrentOu(self.privateAnnouncement)){
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
                .validate()
                .then(function () {
                    if (self.alwaysActive) {
                        self.privateAnnouncement.startDate = null;
                        self.privateAnnouncement.endDate = null;
                    }
                    privateAnnouncementService.updatePrivateAnnouncement(self.privateAnnouncement).then(function () {
                        toast.success(langService.get('edit_success').change({name: self.privateAnnouncement.getNames()}));
                        if(hasCurrentOu && !_checkCurrentOu(self.privateAnnouncement)){
                            privateAnnouncementService.getPrivateAnnouncementByOUID();
                        }

                        if(!hasCurrentOu && _checkCurrentOu(self.privateAnnouncement)){
                            privateAnnouncementService.getPrivateAnnouncementByOUID();
                        }
                        dialog.hide();
                    });
                })
                .catch(function () {

                });
        };

        /**
         * @description Close the popup
         */
        self.closePrivateAnnouncementPopupFromCtrl = function () {
            dialog.cancel();
        };

        self.startDate = null;
        self.endDate = null;

        self.subOU = false;
        self.includedOrganization = null;

        self.alwaysActive = false;
        var today = new Date();
        self.currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (self.editMode) {
            self.alwaysActive = true;
            if (self.model.startDate && self.model.endDate) {
                self.alwaysActive = false;
                self.startDate = self.model.startDate;
                self.endDate = self.model.endDate;
            }

        //    var today = new Date();
            self.isStatusDisabled = moment(self.model.endDate, "YYYY-MM-DD").valueOf() < moment(new Date(today.getFullYear(), today.getMonth(), today.getDate()), "YYYY-MM-DD").valueOf();

            self.currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            var currentDate = self.currentDate.getFullYear() + "-" + (self.currentDate.getMonth() + 1) + "-" + self.currentDate.getDate();

            if (self.model.startDate && typeof self.model.startDate !== "string") {
                self.model.startDate = moment(self.model.startDate).format('YYYY-MM-DD');
            }

            var IsStartDateGreaterThanCurrentDate = (self.model.startDate ? moment(self.model.startDate, "YYYY-MM-DD").valueOf() : null) > (moment(currentDate, "YYYY-MM-DD").valueOf());
            if (IsStartDateGreaterThanCurrentDate) {
                self.currentDate = new Date(self.model.startDate);
            }
        }

        //on change of start date if date is null or start date is greater than end date, then end date will become null//
        self.onStartDateChange = function () {
            self.privateAnnouncement.startDate = self.startDate;

            var today = new Date();
            self.currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            if (self.privateAnnouncement.startDate && typeof self.privateAnnouncement.startDate !== "string") {
                self.privateAnnouncement.startDate = moment(self.privateAnnouncement.startDate).format('YYYY-MM-DD');
            }

            /*var currentDate = self.currentDate.getFullYear() + "-" + (self.currentDate.getMonth() + 1) + "-" + self.currentDate.getDate();
             var IsStartDateGreaterThanCurrentDate = (self.privateAnnouncement.startDate ? moment(self.privateAnnouncement.startDate, "YYYY-MM-DD").valueOf() : null) > (moment(currentDate, "YYYY-MM-DD").valueOf());
             if (IsStartDateGreaterThanCurrentDate) {
             self.currentDate = new Date(self.privateAnnouncement.startDate);
             }
             */
            if (self.privateAnnouncement.startDateGreaterThanCurrentDate()) {
                self.currentDate = new Date(self.privateAnnouncement.startDate);
            }

            /*var IsStartDateGreater = self.compareDate(self.privateAnnouncement, "startDate", "endDate");
             if (!self.privateAnnouncement.startDate || (!IsStartDateGreater && self.privateAnnouncement.startDateGreaterThanCurrentDate())) {
             self.privateAnnouncement.endDate = null;
             self.endDate = null;
             }*/

            if (!self.privateAnnouncement.startDate || (!self.privateAnnouncement.endDateGreaterThanStartDate() && self.privateAnnouncement.startDateGreaterThanCurrentDate())) {
                self.privateAnnouncement.endDate = null;
                self.endDate = null;
            }

        };

        self.onEndDateChange = function () {
            self.privateAnnouncement.endDate = self.endDate;
            if (self.editMode) {
                self.isStatusDisabled = false;
                if (self.privateAnnouncement.endDate) {
                    var today = new Date();
                    self.isStatusDisabled = moment(self.privateAnnouncement.endDate, "YYYY-MM-DD").valueOf() < moment(new Date(today.getFullYear(), today.getMonth(), today.getDate()), "YYYY-MM-DD").valueOf();
                    if (self.isStatusDisabled)
                        self.privateAnnouncement.status = false;
                }
            }

        };

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
                    var isSubscriberExist , indexOfSubOrgUnit;
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
         * function to disable status switch if date < current date
         * @param privateAnnouncement
         * @returns {boolean}
         */
        self.disableStatus = function (privateAnnouncement) {
            var today = new Date();
            if (privateAnnouncement.endDate)
                return moment(privateAnnouncement.endDate, "YYYY-MM-DD").valueOf() < moment(new Date(today.getFullYear(), today.getMonth(), today.getDate()), "YYYY-MM-DD").valueOf();
            else
                return false;
        };

        self.onAlwaysActiveChange = function () {
            if (self.alwaysActive) {
                self.privateAnnouncement.startDate = null;
                self.privateAnnouncement.endDate = null;
                self.startDate = null;
                self.endDate = null;
            }
        };

        /* /!**
         * common function to compare start date and end date, if date1 is greater than date2 then it will return true else false
         * @param model
         * @param date1
         * @param date2
         * @returns {boolean}
         *!/
         self.compareDate = function (model, date1, date2) {
         var startDate = model[date1] ? new moment(model[date1]) : null;
         var endDate = model[date2] ? new moment(model[date2]) : null;

         if (!startDate || !endDate)
         return false;

         return moment(startDate, "YYYY-MM-DD").valueOf() <= moment(endDate, "YYYY-MM-DD").valueOf();
         };
         */
    });
};