module.exports = function (app) {
    app.controller('correspondenceSiteCtrl', function ($q,
                                                       $filter,
                                                       correspondenceSites,
                                                       dialog,
                                                       generator,
                                                       langService,
                                                       organizationService,
                                                       $timeout,
                                                       toast,
                                                       ouCorrespondenceSiteService,
                                                       contextHelpService,
                                                       correspondenceSiteService,
                                                       gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceSiteCtrl';

        self.progress = null;
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
            return correspondenceSiteService
                .controllerMethod
                .correspondenceSiteAdd(null, false, $event)
                .then(function (correspondenceSite) {
                    self.reloadCorrespondenceSites(self.grid.page);
                })
                .catch(function (correspondenceSite) {
                    self.reloadCorrespondenceSites(self.grid.page);
                    if (!correspondenceSite.id)
                        return;
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
                .then(function (correspondenceSite) {
                    self.reloadCorrespondenceSites(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: correspondenceSite.getTranslatedName()}));
                    });
                })
                .catch(function (correspondenceSite) {
                    self.replaceRecordFromGrid(correspondenceSite);
                });
        };

        self.replaceRecordFromGrid = function (correspondenceSite) {
            self.correspondenceSites.splice(_.findIndex(self.correspondenceSites, function (item) {
                return item.id === correspondenceSite.id;
            }), 1, correspondenceSite);
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
            self.progress = defer.promise;

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
            if (correspondenceSite.hasOrganizations()) {
                dialog
                    .confirmMessage(langService.get('related_organization_confirm'), null, null, $event)
                    .then(function () {
                        correspondenceSite.deleteAllOUCorrespondenceSites()
                            .then(function () {
                                correspondenceSite.delete().then(function () {
                                    self.reloadCorrespondenceSites(self.grid.page)
                                        .then(function () {
                                            toast.success(langService.get('delete_specific_success').change({name: correspondenceSite.getNames()}));
                                        });
                                });
                            })
                    })
                    .catch(function () {
                        correspondenceSite.setIsGlobal(false);
                    })

            } else {
                correspondenceSiteService
                    .controllerMethod
                    .correspondenceSiteDelete(correspondenceSite, $event)
                    .then(function () {
                        self.reloadCorrespondenceSites(self.grid.page);
                    });
            }
        };

        /**
         * @description Delete multiple selected correspondenceSite
         * @param $event
         */
        self.removeBulkCorrespondenceSites = function ($event) {
            correspondenceSiteService
                .controllerMethod
                .correspondenceSiteDeleteBulk(self.selectedCorrespondenceSites, $event)
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

        self.openSelectOUCorrespondenceSiteDialog = function (correspondenceSite) {
            return correspondenceSite
                .openDialogToSelectOrganizations()
                .then(function () {
                    return correspondenceSite;
                })
                .catch(function (reason) {
                    console.log(reason);
                });
        };
        /**
         * check global status
         * @param correspondenceSite
         */
        self.changeGlobalFromFromGrid = function (correspondenceSite) {
            //If not global after change, its not allowed. Show alert to user
            if (!correspondenceSite.isGlobal) {
                correspondenceSite.isGlobal = true;
                dialog.alertMessage(langService.get('can_not_change_global_to_private').change({type: langService.get('correspondence_site')}));
                return;
            }
            // if correspondenceSite global(after change) and has organizations.
            if (correspondenceSite.isGlobal && correspondenceSite.hasOrganizations()) {
                dialog.confirmMessage(langService.get('related_organization_confirm'))
                    .then(function () {
                        correspondenceSite
                            .deleteAllOUCorrespondenceSites()
                            .then(function () {
                                correspondenceSite.isGlobal = true;
                                correspondenceSite.update().then(self.displayCorrespondenceSiteGlobalMessage);
                            });
                    })
                    .catch(function () {
                        correspondenceSite.isGlobal = false;
                    })
            }
            // if correspondenceSite global and has not organizations.
            if (correspondenceSite.isGlobal && !correspondenceSite.hasOrganizations()) {
                correspondenceSite.update().then(self.displayCorrespondenceSiteGlobalMessage);
            }
            // if correspondenceSite not global and no organizations.
            if (!correspondenceSite.isGlobal && !correspondenceSite.hasOrganizations()) {
                self.openSelectOUCorrespondenceSiteDialog(correspondenceSite)
                    .then(function (correspondenceSite) {
                        correspondenceSite.update().then(self.displayCorrespondenceSiteGlobalMessage);
                    })
                    .catch(function () {
                        correspondenceSite.setIsGlobal(true).update();
                    });
            }
        };
        /**
         * display for the global messages.
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
         * @description this method to display the sub correspondenceSites for given correspondenceSite
         * @param correspondenceSite
         * @param $event
         */
        self.openSubCorrespondenceSiteDialog = function (correspondenceSite, $event) {
            correspondenceSiteService
                .controllerMethod
                .viewSubCorrespondenceSites(correspondenceSite, $event);
        };
        /**
         * @description this method call when the user take action then close the popup.
         * @param correspondenceSite
         * @return {Promise}
         */
        self.behindScene = function (correspondenceSite) {
            return correspondenceSite.repairGlobalStatus();
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
        }


    });
};