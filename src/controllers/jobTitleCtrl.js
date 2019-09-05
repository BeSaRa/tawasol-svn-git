module.exports = function (app) {
    app.controller('jobTitleCtrl', function (lookupService,
                                             jobTitleService,
                                             jobTitles,
                                             $q,
                                             $filter,
                                             errorCode,
                                             langService,
                                             toast,
                                             contextHelpService,
                                             dialog,
                                             generator,
                                             gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'jobTitleCtrl';
        self.jobTitles = jobTitles;
        self.jobTitlesCopy = angular.copy(self.jobTitles);

        contextHelpService.setHelpTo('job-titles');

        self.selectedJobTitles = [];

        /**
         *@description All job titles
         *  @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.jobTitle) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.jobTitle, self.jobTitles),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.jobTitle, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
                itemOrder: 'itemOrder'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.jobTitles = gridService.searchGridData(self.grid, self.jobTitlesCopy);
            }
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
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.jobTitles = $filter('orderBy')(self.jobTitles, self.grid.order);
        };

        /**
         * @description Reload the grid of job title
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadJobTitles = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return jobTitleService
                .loadJobTitles()
                .then(function (result) {
                    self.jobTitles = result;
                    self.jobTitlesCopy = angular.copy(self.jobTitles);
                    self.selectedJobTitles = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
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
                //toast.error(langService.get('the_status_already_changed'));
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
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
