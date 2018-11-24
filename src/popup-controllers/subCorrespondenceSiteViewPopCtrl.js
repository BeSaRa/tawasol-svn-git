module.exports = function (app) {
    app.controller('subCorrespondenceSiteViewPopCtrl', function ($q,
                                                                 $filter,
                                                                 dialog,
                                                                 toast,
                                                                 generator,
                                                                 correspondenceSite,
                                                                 correspondenceSites,
                                                                 correspondenceSiteService,
                                                                 langService,
                                                                 subCorrespondenceSites,
                                                                 ouCorrespondenceSiteService) {
        'ngInject';
        var self = this;
        self.controllerName = 'subCorrespondenceSiteViewPopCtrl';
        // current correspondenceSite to view his sub correspondenceSites
        self.correspondenceSite = correspondenceSite;

        self.correspondenceSites = subCorrespondenceSites;

        self.parentCorrespondenceSites = correspondenceSites;

        self.selectedCorrespondenceSites = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.correspondenceSites = $filter('orderBy')(self.correspondenceSites, self.grid.order);
        };


        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.correspondenceSites.length + 21);
                }
            }]
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
                .correspondenceSiteAdd($event)
                .then(function () {
                    self.reloadCorrespondenceSites();
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
                .then(function () {
                    self.reloadCorrespondenceSites(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: correspondenceSite.getNames()}));
                    });
                })
                .catch(function (correspondenceSite) {
                    self.replaceRecordFromGrid(correspondenceSite);
                });
        };

        self.replaceRecordFromGrid = function (correspondenceSite) {
            self.correspondenceSite.children.splice(_.findIndex(self.correspondenceSite.children, function (item) {
                return item.id === correspondenceSite.id;
            }), 1, correspondenceSite);
        };
        /**
         * reload the grid again and if the pageNumber provide the current grid will be on it.
         * @param pageNumber
         * @return {*|Promise<Correspondence sites>}
         */
        self.reloadCorrespondenceSites = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return correspondenceSiteService
                .loadSubCorrespondenceSites(self.correspondenceSite)
                .then(function (result) {
                    self.correspondenceSites = result;
                    if (!self.correspondenceSites.length) {
                        dialog.hide(self.parentCorrespondenceSites);
                    }

                    self.selectedCorrespondenceSites = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
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
            self.statusServices[correspondenceSite.status](correspondenceSite)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    correspondenceSite.status = !correspondenceSite.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
        /**
         * @description change the status of correspondenceSite
         * @param correspondenceSite
         */
        self.changeGlobalCorrespondenceSite = function (correspondenceSite) {
            // if correspondenceSite global and has organizations.
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

        self.openSelectOUCorrespondenceSiteDialog = function (correspondenceSite) {
            return correspondenceSite
                .openDialogToSelectOrganizations()
                .then(function () {
                    return correspondenceSite;
                });
        };
        /**
         * @description Change the status of selected correspondenceSite
         * @param status
         */
        self.changeBulkStatusCorrespondenceSites = function (status) {
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedCorrespondenceSites, statusCheck)) {
                //toast.error(langService.get('the_status_already_changed'));
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }

            self.statusServices[status](self.selectedCorrespondenceSites).then(function () {
                self.reloadCorrespondenceSites(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };
        self.removeCorrespondenceSite = function (correspondenceSite, $event) {
            if (correspondenceSite.hasOrganizations()) {
                dialog
                    .confirmMessage(langService.get('related_organization_confirm'), null, null, $event)
                    .then(function () {
                        correspondenceSite.deleteAllOUCorrespondenceSites()
                            .then(function () {
                                correspondenceSite.delete().then(function () {
                                    toast.success(langService.get('delete_specific_success').change({name: correspondenceSite.getNames()}));
                                    self.reloadCorrespondenceSites(self.grid.page);
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
         * close the popup and sent the updated parent correspondenceSites.
         */
        self.closeSubCorrespondenceSiteView = function () {
            dialog.hide(self.parentCorrespondenceSites);
        };
        /**
         * @description this method call when the user take action then close the popup.
         * @param correspondenceSite
         * @return {Promise}
         */
        self.behindScene = function (correspondenceSite) {
            return correspondenceSite.repairGlobalStatus();
        }

    });
};