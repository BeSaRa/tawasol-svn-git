module.exports = function (app) {
    app.service('jobTitleService', function (urlService,
                                             $http,
                                             $q,
                                             generator,
                                             JobTitle,
                                             _,
                                             dialog,
                                             langService,
                                             toast,
                                             cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'jobTitleService';

        self.jobTitles = [];

        /**
         * @description load jobTitles from server.
         * @returns {Promise|jobTitles}
         */
        self.loadJobTitles = function () {
            return $http.get(urlService.jobTitles).then(function (result) {
                self.jobTitles = generator.generateCollection(result.data.rs, JobTitle, self._sharedMethods);
                self.jobTitles = generator.interceptReceivedCollection('JobTitle', self.jobTitles);
                return self.jobTitles;
            });
        };
        /**
         * @description get jobTitles from self.jobTitles if found and if not load it from server again.
         * @returns {Promise|jobTitles}
         */
        self.getJobTitles = function () {
            return self.jobTitles.length ? $q.when(self.jobTitles) : self.loadJobTitles();
        };

        /**
         * @description Contains methods for CRUD operations for jobTitles
         */
        self.controllerMethod = {
            jobTitleAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('job-title'),
                        controller: 'jobTitlePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            jobTitle: new JobTitle(
                                {
                                    itemOrder: generator.createNewID(self.jobTitles, 'itemOrder')
                                }),
                            jobTitles: self.jobTitles
                        }
                    })
            },
            jobTitleEdit: function (jobTitle, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('job-title'),
                        controller: 'jobTitlePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            jobTitle: angular.copy(jobTitle)
                        }
                    })
            },
            jobTitleDelete: function (jobTitle, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: jobTitle.getNames()}))
                    .then(function () {
                        return self.deleteJobTitle(jobTitle).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: jobTitle.getNames()}));
                            return true;
                        })
                    });
            },
            jobTitleDeleteBulk: function (jobTitles, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function (result) {
                        return self.deleteBulkJobTitles(jobTitles);
                        /*return self.deleteBulkJobTitles(jobTitles).then(function (result) {
                         var response = false;
                         if (result.length === jobTitles.length) {
                         toast.error(langService.get("failed_delete_selected"));
                         response = false;
                         }
                         else if (result.length) {
                         generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (jobTitle) {
                         return jobTitle.getNames();
                         }));
                         response = true;
                         }
                         else {
                         toast.success(langService.get("delete_success"));
                         response = true;
                         }
                         return response;
                         });*/
                    });
            }
        };

        /**
         * @description add new jobTitle
         * @param jobTitle
         * @return {Promise|JobTitle}
         */
        self.addJobTitle = function (jobTitle) {
            return $http
                .post(urlService.jobTitles,
                    generator.interceptSendInstance('JobTitle', jobTitle))
                .then(function (result) {
                    return generator.interceptReceivedInstance('JobTitle', generator.generateInstance(result.data.rs, JobTitle, self._sharedMethods));
                });
        };
        /**
         * @description make an update for given jobTitle.
         * @param jobTitle
         * @return {Promise|JobTitle}
         */
        self.updateJobTitle = function (jobTitle) {
            return $http
                .put(urlService.jobTitles,
                    generator.interceptSendInstance('JobTitle', jobTitle))
                .then(function () {
                    return generator.interceptReceivedInstance('JobTitle', generator.generateInstance(jobTitle, JobTitle, self._sharedMethods));
                });
        };
        /**
         * @description delete given jobTitle.
         * @param jobTitle
         * @return {Promise|null}
         */
        self.deleteJobTitle = function (jobTitle) {
            var id = jobTitle.hasOwnProperty('id') ? jobTitle.id : jobTitle;
            return $http.delete(urlService.jobTitles + '/' + id).then(function (result) {
                return result;
            });
        };

        /**
         * @description delete bulk jobTitles.
         * @param jobTitles
         * @return {Promise|null}
         */
        self.deleteBulkJobTitles = function (jobTitles) {
            var bulkIds = jobTitles[0].hasOwnProperty('id') ? _.map(jobTitles, 'id') : jobTitles;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.jobTitles + '/bulk',
                data: bulkIds
            }).then(function (result) {
                /*result = result.data.rs;
                var failedJobTitles = [];
                 _.map(result, function (value, key) {
                 if (!value)
                 failedJobTitles.push(key);
                 });
                 return _.filter(jobTitles, function (jobTitle) {
                 return (failedJobTitles.indexOf(jobTitle.id) > -1);
                 });*/
                return generator.getBulkActionResponse(result, jobTitles, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following');
            });
        };

        /**
         * @description get jobTitle by jobTitleId
         * @param jobTitleId
         * @returns {JobTitle|undefined} return JobTitle Model or undefined if not found.
         */
        self.getJobTitleById = function (jobTitleId) {
            jobTitleId = jobTitleId instanceof JobTitle ? jobTitleId.id : jobTitleId;
            return _.find(self.jobTitles, function (jobTitle) {
                return Number(jobTitle.id) === Number(jobTitleId)
            });
        };

        /**
         * @description activate jobTitle
         * @param jobTitle
         */
        self.activateJobTitle = function (jobTitle) {
            return $http
                .put((urlService.jobTitles + '/activate/' + jobTitle.id))
                .then(function () {
                    return jobTitle;
                });
        };

        /**
         * @description Deactivate jobTitle
         * @param jobTitle
         */
        self.deactivateJobTitle = function (jobTitle) {
            return $http
                .put((urlService.jobTitles + '/deactivate/' + jobTitle.id))
                .then(function () {
                    return jobTitle;
                });
        };

        /**
         * @description Activate bulk of jobTitles
         * @param jobTitles
         */
        self.activateBulkJobTitles = function (jobTitles) {
            return $http
                .put((urlService.jobTitles + '/activate/bulk'), _.map(jobTitles, 'id'))
                .then(function (result) {
                    return generator.getBulkActionResponse(result, jobTitles, false, 'failed_activate_selected', 'success_activate_selected', 'success_activate_selected_except_following');
                    //return jobTitles;
                });
        };

        /**
         * @description Deactivate bulk of jobTitles
         * @param jobTitles
         */
        self.deactivateBulkJobTitles = function (jobTitles) {
            return $http
                .put((urlService.jobTitles + '/deactivate/bulk'), _.map(jobTitles, 'id'))
                .then(function (result) {
                    return generator.getBulkActionResponse(result, jobTitles, false, 'failed_deactivate_selected', 'success_deactivate_selected', 'success_deactivate_selected_except_following');
                //    return jobTitles;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param jobTitle
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateJobTitle = function (jobTitle, editMode) {
            var jobTitlesToFilter = self.jobTitles;
            if (editMode) {
                jobTitlesToFilter = _.filter(jobTitlesToFilter, function (jobTitleToFilter) {
                    return jobTitleToFilter.id !== jobTitle.id;
                });
            }
            return _.some(_.map(jobTitlesToFilter, function (existingJobTitle) {
                return existingJobTitle.arName === jobTitle.arName
                    || existingJobTitle.enName.toLowerCase() === jobTitle.enName.toLowerCase()
                    || existingJobTitle.lookupStrKey.toLowerCase() === jobTitle.lookupStrKey.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteJobTitle, self.updateJobTitle);

    });
};
