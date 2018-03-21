module.exports = function (app) {
    app.provider('themeService', function () {
        'ngInject';
        var provider = this;
        var allowRender = false;
        provider.allowRender = function (value) {
            allowRender = value;
        };

        provider.$get = function (urlService,
                                  $http,
                                  $q,
                                  generator,
                                  Theme,
                                  _,
                                  dialog,
                                  langService,
                                  toast,
                                  cmsTemplate) {
            'ngInject';
            var self = this;
            self.serviceName = 'themeService';

            self.themes = [];

            self.currentTheme = null;

            self.getAllowRender = function () {
                return allowRender;
            };

            /**
             * @description load Themes from server.
             * @returns {Promise|themes}
             */
            self.loadThemes = function () {
                return $http.get(urlService.themes).then(function (result) {
                    self.themes = generator.generateCollection(result.data.rs, Theme, self._sharedMethods);
                    self.themes = generator.interceptReceivedCollection('Theme', self.themes);
                    return self.themes;
                });
            };
            /**
             * @description get Themes from self.themes if found and if not load it from server again.
             * @returns {Promise|themes}
             */
            self.getThemes = function () {
                return self.themes.length ? $q.when(self.themes) : self.loadThemes();
            };

            /**
             * @description Contains methods for CRUD operations for Themes
             */
            self.controllerMethod = {
                themeAdd: function ($event) {
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            template: cmsTemplate.getPopup('theme'),
                            controller: 'themePopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                editMode: false,
                                theme: new Theme(
                                    {
                                        itemOrder: generator.createNewID(self.themes, 'itemOrder')
                                    }),
                                themes: self.themes
                            }
                        }).then(function (result) {
                            return result;
                        });
                },
                themeCopyToAdd: function (theme, $event) {
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            template: cmsTemplate.getPopup('theme'),
                            controller: 'themeCopyPopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                editMode: false,
                                theme: angular.copy(theme),
                                themes: self.themes
                            }
                        }).then(function () {

                        });
                },
                themeEdit: function (theme, $event) {
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            template: cmsTemplate.getPopup('theme'),
                            controller: 'themePopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                editMode: true,
                                theme: angular.copy(theme),
                                themes: self.themes
                            }
                        }).then(function () {

                        })
                },
                themeDelete: function (theme, $event) {
                    return dialog.confirmMessage(langService.get('confirm_delete_theme').change({name: theme.getNames()}))
                        .then(function () {
                            return self.deleteTheme(theme).then(function () {
                                toast.success(langService.get("delete_specific_success").change({name: theme.getNames()}));
                                return true;
                            })
                        });
                },
                themeDeleteBulk: function (themes, $event) {
                    return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                        .then(function (result) {
                            return self.deleteBulkThemes(themes).then(function (result) {
                                var response = false;
                                if (result.length === themes.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                }
                                else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (theme) {
                                        return theme.getNames();
                                    }));
                                    response = true;
                                }
                                else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                        });
                }
            };

            /**
             * @description add new Theme
             * @param theme
             * @return {Promise|Theme}
             */
            self.addTheme = function (theme) {
                return $http
                    .post(urlService.themes,
                        generator.interceptSendInstance('Theme', theme))
                    .then(function (result) {
                        theme.id = result.data.rs;
                        return generator.interceptReceivedInstance('Theme', generator.generateInstance(theme, Theme, self._sharedMethods));
                    });
            };
            /**
             * @description make an update for given Theme.
             * @param theme
             * @return {Promise|Theme}
             */
            self.updateTheme = function (theme) {
                return $http
                    .put(urlService.themes,
                        generator.interceptSendInstance('Theme', theme))
                    .then(function () {
                        return generator.generateInstance(theme, Theme, self._sharedMethods);
                    });
            };
            /**
             * @description delete given Theme.
             * @param theme
             * @return {Promise|null}
             */
            self.deleteTheme = function (theme) {
                var id = theme.hasOwnProperty('id') ? theme.id : theme;
                return $http.delete((urlService.themes + '/' + id));
            };

            /**
             * @description delete bulk Themes.
             * @param themes
             * @return {Promise|null}
             */
            self.deleteBulkThemes = function (themes) {
                var bulkIds = themes[0].hasOwnProperty('id') ? _.map(themes, 'id') : themes;
                return $http({
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    url: urlService.themes + '/bulk',
                    data: bulkIds
                }).then(function (result) {
                    result = result.data.rs;
                    var failedThemes = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedThemes.push(key);
                    });
                    return _.filter(themes, function (theme) {
                        return (failedThemes.indexOf(theme.id) > -1);
                    });
                });
            };

            /**
             * @description get Theme by themeId
             * @param themeId
             * @returns {Theme|undefined} return Theme Model or undefined if not found.
             */
            self.getThemeById = function (themeId) {
                themeId = themeId instanceof Theme ? themeId.id : themeId;
                return _.find(self.themes, function (theme) {
                    return Number(theme.id) === Number(themeId)
                });
            };
            /**
             * @description load theme by Id
             */
            self.loadThemeById = function (themeId) {
                return $http.get(urlService.themes + '/' + themeId)
                    .then(function (result) {
                        var theme = generator.generateInstance(result.data.rs, Theme, self._sharedMethods);
                        return generator.interceptReceivedInstance('Theme', theme);
                    });
            };

            /**
             * @description activate Theme
             * @param theme
             */
            self.activateTheme = function (theme) {
                return $http
                    .put((urlService.themes + '/activate/' + theme.id))
                    .then(function () {
                        return theme;
                    });
            };

            /**
             * @description Deactivate Theme
             * @param theme
             */
            self.deactivateTheme = function (theme) {
                return $http
                    .put((urlService.themes + '/deactivate/' + theme.id))
                    .then(function () {
                        return theme;
                    });
            };

            /**
             * @description Activate bulk of Themes
             * @param themes
             */
            self.activateBulkThemes = function (themes) {
                return $http
                    .put((urlService.themes + '/activate/bulk'), _.map(themes, 'id'))
                    .then(function () {
                        return themes;
                    });
            };

            /**
             * @description Deactivate bulk of Themes
             * @param themes
             */
            self.deactivateBulkThemes = function (themes) {
                return $http
                    .put((urlService.themes + '/deactivate/bulk'), _.map(themes, 'id'))
                    .then(function () {
                        return themes;
                    });
            };

            /**
             * @description Check if record with same name exists. Returns true if exists
             * @param theme
             * @param editMode
             * @returns {boolean}
             */
            self.checkDuplicateTheme = function (theme, editMode) {
                var themesToFilter = self.themes;
                if (editMode) {
                    themesToFilter = _.filter(themesToFilter, function (themeToFilter) {
                        return themeToFilter.id !== theme.id;
                    });
                }
                return _.some(_.map(themesToFilter, function (existingTheme) {
                    return existingTheme.arName === theme.arName
                        || existingTheme.enName.toLowerCase() === theme.enName.toLowerCase();
                }), function (matchingResult) {
                    return matchingResult === true;
                });
            };

            /**
             * @description create the shared method to the model.
             * @type {{delete: generator.delete, update: generator.update}}
             * @private
             */
            self._sharedMethods = generator.generateSharedMethods(self.deleteTheme, self.updateTheme);
            /**
             * @description set current selected theme to be ready for render.
             * @param theme
             * @return {provider}
             */
            self.setCurrentTheme = function (theme) {
                self.currentTheme = theme;
                return self;
            };
            /**
             * @description get current selected theme.
             * @return {null|*}
             */
            self.getCurrentTheme = function () {
                return self.currentTheme;
            };
            /**
             * @description to check if the given theme is the current theme or not.
             * @param theme
             * @return {null|*|boolean}
             */
            self.isSelectedTheme = function (theme) {
                return self.currentTheme && theme.id === self.currentTheme.id;
            };
            /**
             * @description update employee theme.
             * @param theme
             */
            self.updateEmployeeTheme = function (theme) {
                var themeId = theme.hasOwnProperty('id') ? theme.id : theme;
                return $http.put(urlService.layouts.replace('layouts', 'theme/') + themeId)
                    .then(function () {
                        return theme;
                    });
            };
            return self;
        }
    });
};
