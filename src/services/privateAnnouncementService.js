module.exports = function (app) {
    app.service('privateAnnouncementService', function (urlService,
                                                        $http,
                                                        $q,
                                                        generator,
                                                        PrivateAnnouncement,
                                                        _,
                                                        dialog,
                                                        langService,
                                                        toast,
                                                        $sce,
                                                        employeeService,
                                                        cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'privateAnnouncementService';

        self.privateAnnouncements = [];
        self.privateAnnouncementsToShow = [];
        self.count = 0;

        /**
         * @description Load the private announcements from server.
         * @returns {Promise|privateAnnouncements}
         */
        self.loadPrivateAnnouncements = function () {
            return $http.get(urlService.privateAnnouncements).then(function (result) {
                self.privateAnnouncements = generator.generateCollection(result.data.rs, PrivateAnnouncement, self._sharedMethods);
                self.privateAnnouncements = generator.interceptReceivedCollection('PrivateAnnouncement', self.privateAnnouncements);
                return self.privateAnnouncements;
            });
        };

        /**
         * @description Get private announcements from self.privateAnnouncements if found and if not load it from server again.
         * @returns {Promise|privateAnnouncements}
         */
        self.getPrivateAnnouncements = function () {
            return self.privateAnnouncements.length ? $q.when(self.privateAnnouncements) : self.loadPrivateAnnouncements();
        };

        /**
         * @description Contains methods for CRUD operations for private announcements
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new private announcement
             * @param organizations
             * @param organizationsHasRegistry
             * @param $event
             */
            privateAnnouncementAdd: function (organizations, organizationsHasRegistry, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('private-announcement'),
                        controller: 'privateAnnouncementPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            privateAnnouncement: new PrivateAnnouncement(
                                {
                                    itemOrder: generator.createNewID(self.privateAnnouncements, 'itemOrder'),
                                    startDate: new Date()
                                }),
                            privateAnnouncements: self.privateAnnouncements,
                            organizations: organizations,
                            organizationsHasRegistry: organizationsHasRegistry
                        }
                    });
            },
            /**
             * @description Opens popup to edit private announcement
             * @param privateAnnouncement
             * @param organizations
             * @param organizationsHasRegistry
             * @param $event
             */
            privateAnnouncementEdit: function (privateAnnouncement, organizations, organizationsHasRegistry, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('private-announcement'),
                        controller: 'privateAnnouncementPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            privateAnnouncement: privateAnnouncement,
                            privateAnnouncements: self.privateAnnouncements,
                            organizations: organizations,
                            organizationsHasRegistry: organizationsHasRegistry
                        }
                    });
            },
            /**
             * @description Show confirm box and delete private announcement
             * @param privateAnnouncement
             * @param $event
             */
            privateAnnouncementDelete: function (privateAnnouncement, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: privateAnnouncement.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deletePrivateAnnouncement(privateAnnouncement).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: privateAnnouncement.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk private announcements
             * @param privateAnnouncements
             * @param $event
             */
            privateAnnouncementDeleteBulk: function (privateAnnouncements, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkPrivateAnnouncements(privateAnnouncements)
                            .then(function (result) {
                                var response = false;
                                if (result.length === privateAnnouncements.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (privateAnnouncement) {
                                        return privateAnnouncement.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            },

            /**
             * @description Opens dialog to exclude sub organizations for private announcement
             * @param subOrganizations
             * @param organizationsToExclude
             * @param $event
             */
            privateAnnouncementExcludeOrganization: function (subOrganizations, organizationsToExclude, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('exclude-organization'),
                        controller: 'excludeOrganizationPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            subOrganizations: subOrganizations,
                            organizationsToExclude: organizationsToExclude
                        }
                    });
            },
            showAnnouncementMessageBody: function (privateAnnouncement, $event) {
                dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('message-body'),
                    bindToController: true,
                    escToCancel: true,
                    targetEvent: $event,
                    controllerAs: 'ctrl',
                    controller: 'messageBodyPopCtrl',
                    locals: {
                        label: 'announcement_message_body',
                        record: privateAnnouncement,
                        isHtml: true,
                        bodyProperty: {arabic: 'arBody', english: 'enBody'}
                    }
                });
            }
        };

        /**
         * @description Add new private announcement
         * @param privateAnnouncement
         * @return {Promise|PrivateAnnouncement}
         */
        self.addPrivateAnnouncement = function (privateAnnouncement) {
            return $http
                .post(urlService.privateAnnouncements,
                    generator.interceptSendInstance('PrivateAnnouncement', privateAnnouncement))
                .then(function (result) {
                    return generator.interceptReceivedInstance('PrivateAnnouncement', generator.generateInstance(result.data.rs, PrivateAnnouncement, self._sharedMethods));
                });
        };

        /**
         * @description Update the given private announcement.
         * @param privateAnnouncement
         * @return {Promise|PrivateAnnouncement}
         */
        self.updatePrivateAnnouncement = function (privateAnnouncement) {
            return $http
                .put(urlService.privateAnnouncements,
                    generator.interceptSendInstance('PrivateAnnouncement', privateAnnouncement))
                .then(function () {
                    return generator.interceptReceivedInstance('PrivateAnnouncement', generator.generateInstance(privateAnnouncement, PrivateAnnouncement, self._sharedMethods));
                });
        };

        /**
         * @description Delete given private announcement.
         * @param privateAnnouncement
         * @return {Promise|null}
         */
        self.deletePrivateAnnouncement = function (privateAnnouncement) {
            var id = privateAnnouncement.hasOwnProperty('id') ? privateAnnouncement.id : privateAnnouncement;
            return $http.delete((urlService.privateAnnouncements + '/' + id)).then(function (result) {
                return result;
            });
        };

        /**
         * @description Delete bulk private announcements.
         * @param privateAnnouncements
         * @return {Promise|null}
         */
        self.deleteBulkPrivateAnnouncements = function (privateAnnouncements) {
            var bulkIds = privateAnnouncements[0].hasOwnProperty('id') ? _.map(privateAnnouncements, 'id') : privateAnnouncements;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.privateAnnouncements + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedPrivateAnnouncements = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedPrivateAnnouncements.push(key);
                });
                return _.filter(privateAnnouncements, function (privateAnnouncement) {
                    return (failedPrivateAnnouncements.indexOf(privateAnnouncement.id) > -1);
                });
            });
        };

        /**
         * @description Get private announcement by privateAnnouncementId
         * @param privateAnnouncementId
         * @returns {PrivateAnnouncement|undefined} return PrivateAnnouncement Model or undefined if not found.
         */
        self.getPrivateAnnouncementById = function (privateAnnouncementId) {
            privateAnnouncementId = privateAnnouncementId instanceof PrivateAnnouncement ? privateAnnouncementId.id : privateAnnouncementId;
            return _.find(self.privateAnnouncements, function (privateAnnouncement) {
                return Number(privateAnnouncement.id) === Number(privateAnnouncementId)
            });
        };

        /**
         * @description Activate private announcement
         * @param privateAnnouncement
         */
        self.activatePrivateAnnouncement = function (privateAnnouncement) {
            return $http
                .put((urlService.privateAnnouncements + '/activate/' + privateAnnouncement.id))
                .then(function () {
                    return privateAnnouncement;
                });
        };

        /**
         * @description Deactivate private announcement
         * @param privateAnnouncement
         */
        self.deactivatePrivateAnnouncement = function (privateAnnouncement) {
            return $http
                .put((urlService.privateAnnouncements + '/deactivate/' + privateAnnouncement.id))
                .then(function () {
                    return privateAnnouncement;
                });
        };

        /**
         * @description Activate bulk of private announcements
         * @param privateAnnouncements
         */
        self.activateBulkPrivateAnnouncements = function (privateAnnouncements) {
            var bulkIds = privateAnnouncements[0].hasOwnProperty('id') ? _.map(privateAnnouncements, 'id') : privateAnnouncements;
            return $http
                .put((urlService.privateAnnouncements + '/activate/bulk'), bulkIds)
                .then(function () {
                    return privateAnnouncements;
                });
        };

        /**
         * @description Deactivate bulk of private announcements
         * @param privateAnnouncements
         */
        self.deactivateBulkPrivateAnnouncements = function (privateAnnouncements) {
            var bulkIds = privateAnnouncements[0].hasOwnProperty('id') ? _.map(privateAnnouncements, 'id') : privateAnnouncements;
            return $http
                .put((urlService.privateAnnouncements + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return privateAnnouncements;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param privateAnnouncement
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicatePrivateAnnouncement = function (privateAnnouncement, editMode) {
            var privateAnnouncementsToFilter = self.privateAnnouncements;
            if (editMode) {
                privateAnnouncementsToFilter = _.filter(privateAnnouncementsToFilter, function (privateAnnouncementToFilter) {
                    return privateAnnouncementToFilter.id !== privateAnnouncement.id;
                });
            }
            return _.some(_.map(privateAnnouncementsToFilter, function (existingPrivateAnnouncement) {
                return existingPrivateAnnouncement.arSubject === privateAnnouncement.arSubject
                    || existingPrivateAnnouncement.enSubject.toLowerCase() === privateAnnouncement.enSubject.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Check if record has permissions selected or not. Returns true if selected
         * @param privateAnnouncement
         * @returns {boolean}
         */
        self.checkSubscribersExist = function (privateAnnouncement) {
            if (privateAnnouncement.subscribers) {
                if (privateAnnouncement.subscribers.length === 0) {
                    return true;
                }
            } else {
                return true;
            }
            return false;
        };

        /**
         * @description get private announcements by ouID
         */
        self.getPrivateAnnouncementByOUID = function () {
            var employee = employeeService.getEmployee();
            var ouID = employee && employee.hasOwnProperty('organization') ? employee.organization.ouid : null;
            if (!ouID) {
                return $q.resolve([]);
            }
            return $http.get(urlService.privateAnnouncements + "/ou/" + ouID, {
                excludeLoading: true
            }).then(function (result) {
                self.privateAnnouncementsToShow = generator.generateCollection(result.data.rs, PrivateAnnouncement, self._sharedMethods);
                self.privateAnnouncementsToShow = generator.interceptReceivedCollection('PrivateAnnouncement', self.privateAnnouncementsToShow);
                var now = new Date().getTime();
                self.privateAnnouncementsToShow = _.filter(self.privateAnnouncementsToShow, function (announcement) {
                    // if startDate && endDate exists and current time is between startDate and endDate, show it
                    // if always active, show it
                    if (announcement.startDate && announcement.endDate)
                        return announcement.startDate.getTime() <= now && announcement.endDate.getTime() >= now;
                    else
                        return true;
                });
                self.privateAnnouncementsToShow = _.map(self.privateAnnouncementsToShow, function (a) {
                    a.arBody = $sce.trustAsHtml(a.arBody);
                    a.enBody = $sce.trustAsHtml(a.enBody);
                    return a;
                });
                self.count = self.privateAnnouncementsToShow.length;
                return self.privateAnnouncementsToShow;
            });
        };

        function isCurrentOU(currentUserOUID) {
            if (employeeService.isClAdmin()){
                return false;
            }
            var ouID = employeeService.getEmployee().organization.ouid;
            return currentUserOUID === ouID;

        };

        /**
         * @description open popup to show private announcements, if not available then show alert
         * @param $event
         * @param isCloseAutomatically
         */
        self.openPrivateAnnouncementsDialog = function (isCloseAutomatically, $event) {
            return self.getPrivateAnnouncementByOUID().then(function (result) {
                if (self.count === 0) {
                    return;
                }

                return dialog
                    .showDialog({
                        targetEvent: $event || null,
                        templateUrl: cmsTemplate.getPopup('show-private-announcement'),
                        controller: 'showPrivateAnnouncementPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController:true,
                        locals: {
                            privateAnnouncements: result,
                            isCloseAutomatically: isCloseAutomatically
                        }
                    });
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deletePrivateAnnouncement, self.updatePrivateAnnouncement);
    });
};
