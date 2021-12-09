module.exports = function (app) {
    app.service('publicAnnouncementService', function (urlService,
                                                       $http,
                                                       $q,
                                                       generator,
                                                       PublicAnnouncement,
                                                       _,
                                                       dialog,
                                                       langService,
                                                       toast,
                                                       cmsTemplate,
                                                       moment,
                                                       $sce) {
        'ngInject';
        var self = this;
        self.serviceName = 'publicAnnouncementService';

        self.publicAnnouncements = [];

        /**
         * @description Load the public announcements from server.
         * @returns {Promise|publicAnnouncements}
         */
        self.loadPublicAnnouncements = function () {
            return $http.get(urlService.publicAnnouncements).then(function (result) {
                //self.getDateFromUnixTimeStamp(result.data.rs, ["startDate", "endDate"]);

                self.publicAnnouncements = generator.generateCollection(result.data.rs, PublicAnnouncement, self._sharedMethods);
                self.publicAnnouncements = generator.interceptReceivedCollection('PublicAnnouncement', self.publicAnnouncements);
                return self.publicAnnouncements;
            });
        };

        /**
         * @description Get public announcements from self.publicAnnouncements if found and if not load it from server again.
         * @returns {Promise|publicAnnouncements}
         */
        self.getPublicAnnouncements = function () {
            return self.publicAnnouncements.length ? $q.when(self.publicAnnouncements) : self.loadPublicAnnouncements();
        };

        /**
         * @description Contains methods for CRUD operations for public announcements
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new public announcement
             * @param $event
             */
            publicAnnouncementAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('public-announcement'),
                        controller: 'publicAnnouncementPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            publicAnnouncement: new PublicAnnouncement(
                                {
                                    itemOrder: generator.createNewID(self.publicAnnouncements, 'itemOrder'),
                                    startDate: new Date()
                                }),
                            publicAnnouncements: self.publicAnnouncements
                        }
                    });
            },
            /**
             * @description Opens popup to edit public announcement
             * @param publicAnnouncement
             * @param $event
             */
            publicAnnouncementEdit: function (publicAnnouncement, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('public-announcement'),
                        controller: 'publicAnnouncementPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            publicAnnouncement: publicAnnouncement,
                            publicAnnouncements: self.publicAnnouncements
                        }
                    });
            },
            /**
             * @description Show confirm box and delete public announcement
             * @param publicAnnouncement
             * @param $event
             */
            publicAnnouncementDelete: function (publicAnnouncement, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: publicAnnouncement.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deletePublicAnnouncement(publicAnnouncement).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: publicAnnouncement.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk public announcements
             * @param publicAnnouncements
             * @param $event
             */
            publicAnnouncementDeleteBulk: function (publicAnnouncements, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkPublicAnnouncements(publicAnnouncements)
                            .then(function (result) {
                                var response = false;
                                if (result.length === publicAnnouncements.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (publicAnnouncement) {
                                        return publicAnnouncement.getNames();
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
            showAnnouncementMessageBody: function (publicAnnouncement, $event) {
                dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('message-body'),
                    bindToController: true,
                    escToCancel: true,
                    targetEvent: $event,
                    controllerAs: 'ctrl',
                    controller: 'messageBodyPopCtrl',
                    locals: {
                        label: 'announcement_message_body',
                        record: publicAnnouncement,
                        isHtml: true,
                        bodyProperty: {arabic: 'arBody', english: 'enBody'}
                    }
                });
            }
        };

        /**
         * @description Add new public announcement
         * @param publicAnnouncement
         * @return {Promise|PublicAnnouncement}
         */
        self.addPublicAnnouncement = function (publicAnnouncement) {
            //self.getUnixTimeStamp(publicAnnouncement, ["startDate", "endDate"]);
            return $http
                .post(urlService.publicAnnouncements,
                    generator.interceptSendInstance('PublicAnnouncement', publicAnnouncement))
                .then(function (result) {
                    return generator.interceptReceivedInstance('PublicAnnouncement', generator.generateInstance(result.data.rs, PublicAnnouncement, self._sharedMethods));
                });
        };

        /**
         * @description Update the given public announcement.
         * @param publicAnnouncement
         * @return {Promise|PublicAnnouncement}
         */
        self.updatePublicAnnouncement = function (publicAnnouncement) {
            //self.getUnixTimeStamp(publicAnnouncement, ["startDate", "endDate"]);
            return $http
                .put(urlService.publicAnnouncements,
                    generator.interceptSendInstance('PublicAnnouncement', publicAnnouncement))
                .then(function () {
                    return generator.interceptReceivedInstance('PublicAnnouncement', generator.generateInstance(publicAnnouncement, PublicAnnouncement, self._sharedMethods));
                });
        };

        /**
         * @description Delete given public announcement.
         * @param publicAnnouncement
         * @return {Promise|null}
         */
        self.deletePublicAnnouncement = function (publicAnnouncement) {
            var id = publicAnnouncement.hasOwnProperty('id') ? publicAnnouncement.id : publicAnnouncement;
            return $http.delete((urlService.publicAnnouncements + '/' + id)).then(function (result) {
                return result;
            });
        };

        /**
         * @description Delete bulk public announcements.
         * @param publicAnnouncements
         * @return {Promise|null}
         */
        self.deleteBulkPublicAnnouncements = function (publicAnnouncements) {
            var bulkIds = publicAnnouncements[0].hasOwnProperty('id') ? _.map(publicAnnouncements, 'id') : publicAnnouncements;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.publicAnnouncements + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedPublicAnnouncements = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedPublicAnnouncements.push(key);
                });
                return _.filter(publicAnnouncements, function (publicAnnouncement) {
                    return (failedPublicAnnouncements.indexOf(publicAnnouncement.id) > -1);
                });
            });
        };

        /**
         * @description Get public announcement by publicAnnouncementId
         * @param publicAnnouncementId
         * @returns {PublicAnnouncement|undefined} return PublicAnnouncement Model or undefined if not found.
         */
        self.getPublicAnnouncementById = function (publicAnnouncementId) {
            publicAnnouncementId = publicAnnouncementId instanceof PublicAnnouncement ? publicAnnouncementId.id : publicAnnouncementId;
            return _.find(self.publicAnnouncements, function (publicAnnouncement) {
                return Number(publicAnnouncement.id) === Number(publicAnnouncementId)
            });
        };

        /**
         * @description Activate public announcement
         * @param publicAnnouncement
         */
        self.activatePublicAnnouncement = function (publicAnnouncement) {
            return $http
                .put((urlService.publicAnnouncements + '/activate/' + publicAnnouncement.id))
                .then(function () {
                    return publicAnnouncement;
                });
        };

        /**
         * @description Deactivate public announcement
         * @param publicAnnouncement
         */
        self.deactivatePublicAnnouncement = function (publicAnnouncement) {
            return $http
                .put((urlService.publicAnnouncements + '/deactivate/' + publicAnnouncement.id))
                .then(function () {
                    return publicAnnouncement;
                });
        };

        /**
         * @description Activate bulk of public announcements
         * @param publicAnnouncements
         */
        self.activateBulkPublicAnnouncements = function (publicAnnouncements) {
            var bulkIds = publicAnnouncements[0].hasOwnProperty('id') ? _.map(publicAnnouncements, 'id') : publicAnnouncements;
            return $http
                .put((urlService.publicAnnouncements + '/activate/bulk'), bulkIds)
                .then(function () {
                    return publicAnnouncements;
                });
        };

        /**
         * @description Deactivate bulk of public announcements
         * @param publicAnnouncements
         */
        self.deactivateBulkPublicAnnouncements = function (publicAnnouncements) {
            var bulkIds = publicAnnouncements[0].hasOwnProperty('id') ? _.map(publicAnnouncements, 'id') : publicAnnouncements;
            return $http
                .put((urlService.publicAnnouncements + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return publicAnnouncements;
                });
        };

        /* /!**
         * @description Set the globalization of public announcement
         * @param publicAnnouncement
         *!/
         self.globalizePublicAnnouncement = function (publicAnnouncement) {
         return $http
         .put(urlService.publicAnnouncements, publicAnnouncement)
         .then(function () {
         return publicAnnouncement;
         });
         };*/

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param publicAnnouncement
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicatePublicAnnouncement = function (publicAnnouncement, editMode) {
            var publicAnnouncementsToFilter = self.publicAnnouncements;
            if (editMode) {
                publicAnnouncementsToFilter = _.filter(publicAnnouncementsToFilter, function (publicAnnouncementToFilter) {
                    return publicAnnouncementToFilter.id !== publicAnnouncement.id;
                });
            }
            return _.some(_.map(publicAnnouncementsToFilter, function (existingPublicAnnouncement) {
                return existingPublicAnnouncement.arSubject === publicAnnouncement.arSubject
                    || existingPublicAnnouncement.enSubject.toLowerCase() === publicAnnouncement.enSubject.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * convert Date to Unix Timestamp
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        self.getUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                if (typeof model[modelProperties[i]] !== "string" && typeof model[modelProperties[i]] !== "number" && model[modelProperties[i]]) {
                    var getDate = model[modelProperties[i]].getDate();
                    var getMonth = model[modelProperties[i]].getMonth() + 1;
                    var getFullYear = model[modelProperties[i]].getFullYear();
                    model[modelProperties[i]] = getFullYear + "-" + getMonth + "-" + getDate;
                }
                if (typeof model[modelProperties[i]] === "string" || typeof model[modelProperties[i]] === "object") {
                    model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]], "YYYY-MM-DD").valueOf() : null;
                }
            }
            return model;
        };

        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        self.getDateFromUnixTimeStamp = function (model, modelProperties) {
            for (var j = 0; j < model.length; j++) {
                for (var i = 0; i < modelProperties.length; i++) {
                    model[j][modelProperties[i]] = model[j][modelProperties[i]] ? moment(model[j][modelProperties[i]]).format('YYYY-MM-DD') : null;
                }
            }
            return model;
        };


        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deletePublicAnnouncement, self.updatePublicAnnouncement);
    });
};
