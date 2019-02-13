module.exports = function (app) {
    app.controller('subCorrespondenceSiteViewPopCtrl', function ($q,
                                                                 $filter,
                                                                 dialog,
                                                                 toast,
                                                                 generator,
                                                                 mainCorrespondenceSite,
                                                                 subCorrespondenceSites,
                                                                 correspondenceSiteService,
                                                                 langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'subCorrespondenceSiteViewPopCtrl';

        self.mainCorrespondenceSite = mainCorrespondenceSite;
        self.subCorrespondenceSites = subCorrespondenceSites;
        self.selectedSubCorrespondenceSites = [];

        self.searchMode = '';
        self.searchMode = false;

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.subCorrespondenceSites = $filter('orderBy')(self.subCorrespondenceSites, self.grid.order);
        };

        self.grid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.subCorrespondenceSites.length + 21);
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
         * @description Opens dialog for add new subCorrespondenceSite
         * @param $event
         */
        self.openAddSubCorrespondenceSiteDialog = function ($event) {
            return correspondenceSiteService.controllerMethod
                .correspondenceSiteAdd(self.mainCorrespondenceSite, false, $event)
                .then(function (result) {
                    self.reloadSubCorrespondenceSites(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadSubCorrespondenceSites(self.grid.page);
                });
        };

        /**
         * @description Opens dialog for edit subCorrespondenceSite
         * @param subCorrespondenceSite
         * @param $event
         */
        self.openEditSubCorrespondenceSiteDialog = function (subCorrespondenceSite, $event) {
            correspondenceSiteService
                .controllerMethod
                .correspondenceSiteEdit(subCorrespondenceSite, $event)
                .then(function (result) {
                    self.reloadSubCorrespondenceSites(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: subCorrespondenceSite.getNames()}));
                    });
                })
                .catch(function (error) {
                    self.reloadSubCorrespondenceSites(self.grid.page);
                });
        };

        /**
         * reload the grid again and if the pageNumber provide the current grid will be on it.
         * @param pageNumber
         * @return {*|Promise<Correspondence sites>}
         */
        self.reloadSubCorrespondenceSites = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            self.searchMode = false;
            self.searchModel = '';
            return correspondenceSiteService
                .loadSubCorrespondenceSites(self.mainCorrespondenceSite)
                .then(function (result) {
                    self.subCorrespondenceSites = result;
                    self.selectedSubCorrespondenceSites = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single subCorrespondenceSite
         * @param subCorrespondenceSite
         * @param $event
         */
        self.removeSubCorrespondenceSite = function (subCorrespondenceSite, $event) {
            correspondenceSiteService
                .controllerMethod
                .correspondenceSiteDelete(subCorrespondenceSite, $event)
                .then(function () {
                    self.reloadSubCorrespondenceSites(self.grid.page);
                });
        };

        /**
         * @description change the status of subCorrespondenceSite
         * @param subCorrespondenceSite
         */
        self.changeStatusSubCorrespondenceSite = function (subCorrespondenceSite) {
            subCorrespondenceSite.updateStatus()
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    subCorrespondenceSite.status = !subCorrespondenceSite.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
        /**
         * @description change the global of subCorrespondenceSite
         * @param subCorrespondenceSite
         */
        self.changeGlobalSubCorrespondenceSite = function (subCorrespondenceSite) {
            //If subCorrespondenceSite is not global(after change), its not allowed. Show alert to user
            if (!subCorrespondenceSite.isGlobal) {
                subCorrespondenceSite.isGlobal = true;
                dialog.alertMessage(langService.get('can_not_change_global_to_private').change({type: langService.get('correspondence_site')}));
            } else {
                dialog.confirmMessage(langService.get('related_organization_confirm'))
                    .then(function () {
                        subCorrespondenceSite.update().then(self.displayCorrespondenceSiteGlobalMessage);
                    })
                    .catch(function () {
                        subCorrespondenceSite.isGlobal = !subCorrespondenceSite.isGlobal;
                    });
            }
        };

        /**
         * @description display for the global message.
         * @param subCorrespondenceSite
         */
        self.displayCorrespondenceSiteGlobalMessage = function (subCorrespondenceSite) {
            toast.success(langService.get('change_global_success')
                .change({
                    name: subCorrespondenceSite.getTranslatedName(),
                    global: subCorrespondenceSite.getTranslatedGlobal()
                }));
        };

        self.openSelectOUCorrespondenceSiteDialog = function (subCorrespondenceSite) {
            return subCorrespondenceSite
                .openDialogToSelectOrganizations()
                .then(function () {
                    return subCorrespondenceSite;
                });
        };
        /**
         * @description Change the status of selected subCorrespondenceSite
         * @param status
         */
        self.changeBulkStatusSubCorrespondenceSites = function (status) {
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedSubCorrespondenceSites, statusCheck)) {
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }

            self.statusServices[status](self.selectedSubCorrespondenceSites).then(function () {
                self.reloadCorrespondenceSites(self.grid.page);
            });
        };

        /**
         * @description search in classification.
         * @param searchText
         * @return {*}
         */
        self.searchInSubCorrespondenceSites = function (searchText) {
            if (!searchText)
                return;
            self.searchMode = true;
            return correspondenceSiteService
                .correspondenceSiteSearch(searchText, self.mainCorrespondenceSite)
                .then(function (result) {
                    self.subCorrespondenceSites = result;
                });
        };

        /**
         * close the popup.
         */
        self.closeSubCorrespondenceSiteView = function () {
            dialog.cancel();
        };

    });
};