module.exports = function (app) {
    app.controller('themeCtrl', function (lookupService,
                                          themeService,
                                          themes,
                                          $q,
                                          $filter,
                                          langService,
                                          toast,
                                          contextHelpService,
                                          dialog,
                                          rootEntity,
                                          gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'themeCtrl';
        self.colors = [1, 2, 3, 4, 5, 6, 7, 8];

        contextHelpService.setHelpTo('themes');
        self.globalSettings = rootEntity.getGlobalSettings();
        /**
         *@description All themes
         */
        self.themes = themes;
        self.themesCopy = angular.copy(self.themes);

        self.selectedThemes = [];
        /**
         *@description Grid Bind
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.theme) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.theme, self.themes),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.theme, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.themes = gridService.searchGridData(self.grid, self.themesCopy);
            }
        };
        /**
         *@description Contains methods for CRUD operations for themes
         */
        self.statusServices = {
            'activate': themeService.activateBulkThemes,
            'deactivate': themeService.deactivateBulkThemes,
            'true': themeService.activateTheme,
            'false': themeService.deactivateTheme
        };

        /**
         * @description Check if the theme is a default theme
         * @param theme
         * @param $event
         * @returns {boolean}
         */
        self.isDefaultTheme = function (theme, $event) {
            var globalTheme = self.globalSettings.theme;
            return globalTheme.hasOwnProperty('id') ? (globalTheme.id === theme.id) : (globalTheme === theme.id);
        };

        /**
         * @description Opens dialog for add new theme
         * @param $event
         */
        self.openAddThemeDialog = function ($event) {
            themeService
                .controllerMethod
                .themeAdd($event)
                .then(function (result) {
                    self.reloadThemes(self.grid.page).then(function () {
                        toast.success(langService.get('add_success').change({name: result.getNames()}));
                    });
                })
        };

        /**
         * @description Opens dialog for edit theme
         * @param $event
         * @param theme
         */
        self.openEditThemeDialog = function (theme, $event) {
            themeService
                .controllerMethod
                .themeEdit(theme, $event)
                .then(function (result) {
                    self.reloadThemes(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: theme.getNames()}));
                    });
                })
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.themes = $filter('orderBy')(self.themes, self.grid.order);
        };

        /**
         * @description Reload the grid of theme
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadThemes = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return themeService
                .loadThemes()
                .then(function (result) {
                    self.themes = result;
                    self.themesCopy = angular.copy(self.themes);
                    self.selectedThemes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                })
        };

        /**
         * @description Delete single theme
         * @param theme
         * @param $event
         */
        self.removeTheme = function (theme, $event) {
            themeService
                .controllerMethod
                .themeDelete(theme, $event)
                .then(function (result) {
                    self.reloadThemes(self.grid.page);
                })
        };

        /**
         * @description Delete multiple selected themes
         * @param $event
         */
        self.removeBulkThemes = function ($event) {
            themeService
                .controllerMethod
                .themeDeleteBulk(self.selectedThemes, $event)
                .then(function () {
                    self.reloadThemes(self.grid.page);
                })
        };

        /**
         * @description Change the status of theme from grid
         * @param theme
         */
        self.changeStatusForTheme = function (theme) {
            self.statusServices[theme.status](theme)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    theme.status = !theme.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected themes
         * @param status
         */
        self.changeBulkStatusThemes = function (status) {
            self.statusServices[status](self.selectedThemes).then(function () {
                self.reloadThemes(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };
        /**
         * @description copy theme to add
         * @param theme/event
         * @param $event
         */
        self.copyThemeToAdd = function (theme, $event) {
            themeService
                .controllerMethod
                .themeCopyToAdd(theme, $event)
                .then(function () {
                    self.reloadThemes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('copy_theme_success'));
                        });
                })
        };

    });
};
