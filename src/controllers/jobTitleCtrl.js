module.exports = function (app) {
    app.controller('jobTitleCtrl', function (lookupService,
                                             jobTitleService,
                                             jobTitles,
                                             $q,
                                             errorCode,
                                             langService,
                                             toast,
                                             contextHelpService,
                                             dialog,
                                             generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'jobTitleCtrl';
        self.jobTitles = jobTitles;

        contextHelpService.setHelpTo('job-titles');

        /**
         *@description All job titles
         */
        self.promise = null;
        self.selectedJobTitles = [];

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.jobTitles.length + 21);
                    }
                }
            ]
        };
        /**
         *@description Contains methods for CRUD operations for job titles
         */
        self.statusServices = {
            'activate': jobTitleService.activateBulkJobTitles,
            'deactivate': jobTitleService.deactivateBulkJobTitles,
            'true': jobTitleService.activateJobTitle,
            'false': jobTitleService.deactivateJobTitle
        };

        /**
         * @description Opens dialog for add new job title
         * @param $event
         */
        self.openAddJobTitleDialog = function ($event) {
            jobTitleService
                .controllerMethod
                .jobTitleAdd($event)
                .then(function (result) {
                    self.reloadJobTitles(self.grid.page).then(function () {
                        toast.success(langService.get('add_success').change({name: result.getNames()}));
                    });
                });
        };

        /**
         * @description Opens dialog for edit job title
         * @param $event
         * @param jobTitle
         */
        self.openEditJobTitleDialog = function (jobTitle, $event) {
            jobTitleService
                .controllerMethod
                .jobTitleEdit(jobTitle, $event)
                .then(function (result) {
                    self.reloadJobTitles(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    });
                });
        };

        /**
         * @description Reload the grid of job title
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadJobTitles = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return jobTitleService
                .loadJobTitles()
                .then(function (result) {
                    self.jobTitles = result;
                    self.selectedJobTitles = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete single job title
         * @param jobTitle
         * @param $event
         */
        self.removeJobTitle = function (jobTitle, $event) {
            jobTitleService
                .controllerMethod
                .jobTitleDelete(jobTitle, $event)
                .then(function () {
                    self.reloadJobTitles(self.grid.page);
                })
                .catch(function (error) {
                    if (!error)
                        return;
                    errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                        dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                            lookup: langService.get('job_title'),
                            used: langService.get('other_users')
                        }), null, null, $event);
                    });
                });
        };

        /**
         * @description Delete multiple selected job titles
         * @param $event
         */
        self.removeBulkJobTitles = function ($event) {
            jobTitleService
                .controllerMethod
                .jobTitleDeleteBulk(self.selectedJobTitles, $event)
                .then(function () {
                    self.reloadJobTitles(self.grid.page);
                });
        };

        /**
         * @description Change the status of job title from grid
         * @param jobTitle
         */
        self.changeStatusJobTitle = function (jobTitle) {
            self.statusServices[jobTitle.status](jobTitle)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    jobTitle.status = !jobTitle.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        /**
         * @description Change the status of selected job titles
         * @param status
         */
        self.changeStatusBulkJobTitles = function (status) {
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedJobTitles, statusCheck)) {
                toast.error(langService.get('the_status_already_changed'));
                return;
            }
            self.statusServices[status](self.selectedJobTitles).then(function () {
                self.reloadJobTitles(self.grid.page).then(function () {
                    //toast.success(langService.get('selected_status_updated'));
                });
            });
        };
    });
};