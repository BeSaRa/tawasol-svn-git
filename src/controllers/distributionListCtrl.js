module.exports = function (app) {
    app.controller('distributionListCtrl', function (lookupService,
                                                     distributionListService,
                                                     mainCorrespondenceSites,
                                                     organizations,
                                                     distributionLists,
                                                     $q,
                                                     langService,
                                                     toast,
                                                     dialog,
                                                     contextHelpService,
                                                     ouDistributionListService,
                                                     generator) {
        'ngInject';
            var self = this;

            self.controllerName = 'distributionListCtrl';
            self.mainCorrespondenceSites = mainCorrespondenceSites;
            self.organizations = organizations;

            self.progress = null;
            contextHelpService.setHelpTo('distribution-list');

            /**
             * @description All Distribution Lists
             * @type {*}
             */
            self.distributionLists = distributionLists;

            /**
             * @description Contains the selected Distribution Lists
             * @type {Array}
             */
            self.selectedDistributionLists = [];

            /**
             * @description Contains options for grid configuration
             * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
             */
            self.grid = {
                limit: 5, // default limit
                page: 1, // first page
                //order: 'arName', // default sorting order
                order: '', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return self.distributionLists.length
                        }
                    }
                ]
            };

            /**
             * @description Contains methods for CRUD operations for Distribution Lists
             */
            self.statusServices = {
                'activate': distributionListService.activateBulkDistributionLists,
                'deactivate': distributionListService.deactivateBulkDistributionLists,
                'true': distributionListService.activateDistributionList,
                'false': distributionListService.deactivateDistributionList
            };

            /**
             * @description Opens dialog for add new Distribution List
             * @param $event
             */
            self.openAddDistributionListDialog = function ($event) {
                distributionListService
                    .controllerMethod
                    .distributionListAdd(self.mainCorrespondenceSites, self.organizations, $event)
                    .then(function () {
                        self.reloadDistributionLists(self.grid.page);
                    })
                    .catch(function(){
                        self.reloadDistributionLists(self.grid.page);
                    })
            };

            /**
             * @description Opens dialog for edit Distribution List
             * @param $event
             * @param distributionList
             */
            self.openEditDistributionListDialog = function (distributionList, $event) {
                distributionListService
                    .controllerMethod
                    .distributionListEdit(distributionList, self.mainCorrespondenceSites, self.organizations, $event)
                    .then(function (result) {
                        self.behindScene(result)
                            .then(function (result) {
                                self.reloadDistributionLists(self.grid.page).then(function () {
                                    toast.success(langService.get('edit_success').change({name: distributionList.getTranslatedName()}));
                                });
                            });
                    }).catch(function () {
                    self.behindScene(distributionList)
                        .then(function () {
                            self.reloadDistributionLists(self.grid.page);
                        });
                });
            };

            /**
             * @description Reload the grid of Distribution List
             * @param pageNumber
             * @return {*|Promise<U>}
             */
            self.reloadDistributionLists = function (pageNumber) {
                var defer = $q.defer();
                self.progress = defer.promise;

                return ouDistributionListService
                    .loadOUDistributionLists()
                    .then(function () {
                        return distributionListService
                            .loadDistributionLists()
                            .then(function (result) {
                                self.distributionLists = result;
                                self.selectedDistributionLists = [];
                                defer.resolve(true);
                                if (pageNumber)
                                    self.grid.page = pageNumber;
                                return result;
                            });
                    });

            };

            /**
             * @description Delete single Distribution List
             * @param distributionList
             * @param $event
             */
            self.removeDistributionList = function (distributionList, $event) {
                distributionListService
                    .controllerMethod
                    .distributionListDelete(distributionList, $event)
                    .then(function () {
                        self.reloadDistributionLists(self.grid.page);
                    });
            };

            /**
             * @description Delete multiple selected Distribution Lists
             * @param $event
             */
            self.removeBulkDistributionLists = function ($event) {
                distributionListService
                    .controllerMethod
                    .distributionListDeleteBulk(self.selectedDistributionLists, $event)
                    .then(function () {
                        self.reloadDistributionLists(self.grid.page);
                    });
            };

            /**
             * @description Change the status of Distribution List
             * @param distributionList
             */
            self.changeStatusDistributionList = function (distributionList) {
                self.statusServices[distributionList.status](distributionList)
                    .then(function () {
                        toast.success(langService.get('status_success'));
                    })
                    .catch(function () {
                        distributionList.status = !distributionList.status;
                        dialog.errorMessage(langService.get('something_happened_when_update_status'));
                    })
            };

            /**
             * @description Change the status of selected Distribution Lists
             * @param status
             */
            self.changeStatusBulkDistributionLists = function (status) {
                self.statusServices[status](self.selectedDistributionLists).then(function () {
                    self.reloadDistributionLists(self.grid.page).then(function () {
                        toast.success(langService.get('selected_status_updated'));
                    });
                });
            };

            /*/!**
             * @description Change the globalization of Distribution List
             * @param distributionList
             *!/
             self.changeGlobalDistributionList = function (distributionList) {
             if (distributionList.global) {
             /!* distributionListService.globalizeDistributionList(distributionList)
             .then(function () {
             toast.success(langService.get('globalization_success'));
             })
             .catch(function () {
             distributionList.global = !distributionList.global;
             dialog.errorMessage(langService.get('something_happened_when_update_global'));
             });*!/
             }
             else {
             }
             };*/

            /**
             * check global status
             * @param distributionList
             */
            self.changeGlobalFromFromGrid = function (distributionList) {
                // if distribution global and has organizations.
                if (distributionList.global && distributionList.hasOrganizations()) {
                    dialog.confirmMessage(langService.get('related_organization_confirm'))
                        .then(function () {
                            distributionList
                                .deleteAllOUDistributionLists()
                                .then(function () {
                                    distributionList.global = true;
                                    distributionList.update().then(self.displayDistributionListGlobalMessage);
                                });
                        })
                        .catch(function () {
                            distributionList.global = false;
                        })
                }
                // if distributionList global and has not organizations.
                if (distributionList.global && !distributionList.hasOrganizations()) {
                    distributionList.update().then(self.displayDistributionListGlobalMessage);
                }
                // if distributionList not global and no organizations.
                if (!distributionList.global && !distributionList.hasOrganizations()) {
                    self.openSelectOUDistributionListDialog(distributionList)
                        .then(function (distributionList) {
                            distributionList.update().then(self.displayDistributionListGlobalMessage);
                        })
                        .catch(function () {
                            distributionList.setIsGlobal(true).update();
                        });
                }
            };
            /**
             * display for the global messages.
             * @param distributionList
             */
            self.displayDistributionListGlobalMessage = function (distributionList) {
                toast.success(langService.get('change_global_success')
                    .change({
                        name: distributionList.getTranslatedName(),
                        global: distributionList.getTranslatedGlobal()
                    }));
            };

            self.openSelectOUDistributionListDialog = function (distributionList) {
                return distributionList
                    .openDialogToSelectOrganizations()
                    .then(function () {
                        return distributionList;
                    });
            };
            /**
             * @description this method call when the user take action then close the popup.
             * @return {Promise}
             * @param distributionList
             */
            self.behindScene = function (distributionList) {
                return distributionList.repairGlobalStatus();
            }
        }
    )
    ;
};