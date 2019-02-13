module.exports = function (app) {
    app.controller('correspondenceSiteCtrl', function ($q,
                                                       $filter,
                                                       correspondenceSites,
                                                       dialog,
                                                       generator,
                                                       langService,
                                                       $timeout,
                                                       toast,
                                                       contextHelpService,
                                                       correspondenceSiteService,
                                                       gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceSiteCtrl';
        contextHelpService.setHelpTo('correspondence-sites');
        /**
         * @description All correspondenceSites
         * @type {*}
         */
        self.correspondenceSites = correspondenceSiteService.getMainCorrespondenceSites(correspondenceSites);
        /**
         * @description Contains the selected correspondenceSite
         * @type {Array}
         */
        self.selectedCorrespondenceSites = [];

        self.searchMode = '';
        self.searchMode = false;

        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.correspondenceSite) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.correspondenceSite, self.correspondenceSites),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.correspondenceSite, limit);
            }
        };

        self.statusServices = {
            'activate': correspondenceSiteService.activateBulkCorrespondenceSites,
            'deactivate': correspondenceSiteService.deactivateBulkCorrespondenceSites,
            'true': correspondenceSiteService.activateCorrespondenceSite,
            'false': correspondenceSiteService.deactivateCorrespondenceSite
        };

        /**
         * @description Opens dialog for add new correspondenceSite
         * @param $event
         */
        self.openAddCorrespondenceSiteDialog = function ($event) {
            return correspondenceSiteService.controllerMethod
                .correspondenceSiteAdd(null, false, $event)
                .then(function (result) {
                    self.reloadCorrespondenceSites(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadCorrespondenceSites(self.grid.page);
                });
        };

        /**
         * @description Opens dialog for edit correspondenceSite
         * @param correspondenceSite
         * @param $event
         */
        self.openEditCorrespondenceSiteDialog = function (correspondenceSite, $event) {
            correspondenceSiteService
                .controllerMethod
                .correspondenceSiteEdit(correspondenceSite, $event)
                .then(function (result) {
                    self.reloadCorrespondenceSites(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: result.getTranslatedName()}));
                    });
                })
                .catch(function (error) {
                    self.reloadCorrespondenceSites(self.grid.page);
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.correspondenceSites = $filter('orderBy')(self.correspondenceSites, self.grid.order);
        };

        /**
         * reload the grid again and if the pageNumber provide the current grid will be on it.
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadCorrespondenceSites = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;

            self.searchMode = false;
            self.searchModel = '';
            return correspondenceSiteService
                .loadCorrespondenceSitesWithLimit()
                .then(function (correspondenceSites) {
                    self.correspondenceSites = correspondenceSiteService.getMainCorrespondenceSites(correspondenceSites);
                    self.selectedCorrespondenceSites = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return correspondenceSites;
                });

        };

        /**
         * @description Delete single correspondenceSite
         * @param correspondenceSite
         * @param $event
         */
        self.removeCorrespondenceSite = function (correspondenceSite, $event) {
            correspondenceSiteService
                .controllerMethod
                .correspondenceSiteDelete(correspondenceSite, $event)
                .then(function () {
                    self.reloadCorrespondenceSites(self.grid.page);
                });
        };

        /**
         * @description change the status of correspondenceSite
         * @param correspondenceSite
         */
        self.changeStatusCorrespondenceSite = function (correspondenceSite) {
            correspondenceSite.updateStatus()
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    correspondenceSite.status = !correspondenceSite.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        /**
         * @description Update global for correspondence site after the switch in grid is changed
         * isGlobal property contains value after change.
         * @param correspondenceSite
         */
        self.changeGlobalFromFromGrid = function (correspondenceSite) {
            //If correspondenceSite is not global(after change), its not allowed. Show alert to user
            if (!correspondenceSite.isGlobal) {
                correspondenceSite.isGlobal = true;
                dialog.alertMessage(langService.get('can_not_change_global_to_private').change({type: langService.get('correspondence_site')}));
            } else {
                dialog.confirmMessage(langService.get('related_organization_confirm'))
                    .then(function () {
                        correspondenceSite.update().then(self.displayCorrespondenceSiteGlobalMessage);
                    })
                    .catch(function () {
                        correspondenceSite.isGlobal = !correspondenceSite.isGlobal;
                    });
            }
        };
        /**
         * @description Displays message for change of global value.
         * @param correspondenceSite
         */
        self.displayCorrespondenceSiteGlobalMessage = function (correspondenceSite) {
            toast.success(langService.get('change_global_success')
                .change({
                    name: correspondenceSite.getTranslatedName(),
                    global: correspondenceSite.getTranslatedGlobal()
                }));
        };
        /**
         * @description Change the status of selected correspondenceSite
         * @param status
         */
        self.changeBulkStatusCorrespondenceSites = function (status) {
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedCorrespondenceSites, statusCheck)) {
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }

            self.statusServices[status](self.selectedCorrespondenceSites).then(function () {
                self.reloadCorrespondenceSites(self.grid.page);
            });
        };

        /**
         * @description search in classification.
         * @param searchText
         * @return {*}
         */
        self.searchInCorrespondenceSites = function (searchText) {
            if (!searchText)
                return;
            self.searchMode = true;
            return correspondenceSiteService
                .correspondenceSiteSearch(searchText)
                .then(function (result) {
                    self.correspondenceSites = result;
                });
        };

        /**
         * @description Display the sub correspondenceSites for given correspondenceSite
         * @param correspondenceSite
         * @param $event
         */
        self.openSubCorrespondenceSiteDialog = function (correspondenceSite, $event) {
            correspondenceSiteService
                .controllerMethod
                .viewSubCorrespondenceSites(correspondenceSite, $event)
                .then(function () {
                    self.reloadCorrespondenceSites(self.grid.page);
                })
                .catch(function () {
                    self.reloadCorrespondenceSites(self.grid.page);
                });
        };

    });
};