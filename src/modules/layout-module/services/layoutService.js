module.exports = function (app) {
    app.service('layoutService', function (_,
                                           employeeService,
                                           generator,
                                           Layout,
                                           $timeout,
                                           LayoutWidget,
                                           LayoutWidgetOption,
                                           urlService,
                                           cmsTemplate,
                                           dialog,
                                           Widget,
                                           $http) {
        'ngInject';
        var self = this;
        self.serviceName = 'layoutService';
        self.layouts = [];
        self.widgets = [];
        self.lastInsertedLayoutWidget = null;

        // temporary  headers
        var _currentOrganization = function () {
            return {}
        };
        /**
         * load user layouts
         */
        self.loadUserLayouts = function () {
            return $http.get(urlService.layouts, _currentOrganization(), {
                excludeLoading: true
            }).then(function (result) {
                self.layouts = generator.generateCollection(result.data.rs, Layout);
                self.layouts = generator.interceptReceivedCollection('Layout', self.layouts);
                return self.layouts;
            });
        };
        /**
         * set current layout
         * @param layout
         */
        self.setCurrentLayout = function (layout) {
            return $http
                .post((urlService.layouts + '/' + layout.id + '/is-current'), null, _currentOrganization())
                .then(function () {
                    self.layouts = _.map(self.layouts, function (item) {
                        item.isCurrent = (item.id === layout.id);
                        return item;
                    });
                });
        };

        /**
         * load widgets
         */
        self.loadWidgets = function () {
            return $http
                .get(urlService.layouts.replace('layouts', 'widgets'), {
                    excludeLoading: true
                })
                .then(function (result) {
                    self.widgets = generator.generateCollection(result.data.rs, Widget);
                    self.widgets = generator.interceptReceivedCollection('Widget', self.widgets);
                    return self.widgets;
                });
        };
        /**
         * return current selected layout
         */
        self.getCurrentLayout = function () {
            return _.find(self.layouts, function (layout) {
                return layout.isCurrent;
            });
        };
        /**
         * add new layout for current user.
         * @param layout
         */
        self.addLayout = function (layout) {
            return $http
                .post(urlService.layouts, (generator.interceptSendInstance('Layout', layout)), _currentOrganization())
                .then(function (result) {
                    layout.id = result.data.rs;
                    layout.ouApplicationUserId = employeeService.getCurrentOUApplicationUser().id;
                    return generator.generateInstance(layout, Layout);
                });
        };
        /**
         * delete given layout from server.
         * @param layout
         * @return {Promise}
         */
        self.deleteLayout = function (layout) {
            var layoutId = layout.hasOwnProperty('id') ? layout.id : layout;
            return $http.delete((urlService.layouts + '/' + layoutId), _currentOrganization());
        };
        /**
         * update layout
         * @param layout
         */
        self.updateLayout = function (layout) {
            return $http.put(urlService.layouts,
                generator.interceptSendInstance('Layout', layout)
                , _currentOrganization())
                .then(function () {
                    return generator.generateInstance(layout, Layout);
                });
        };

        /**
         * @description Delete bulk organization types.
         * @param layouts
         * @return {Promise|null}
         */
        self.deleteBulkLayouts = function (layouts) {
            var bulkIds = layouts[0].hasOwnProperty('id') ? _.map(layouts, 'id') : layouts;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: (urlService.layouts + '/bulk'),
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedLayouts = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedLayouts.push(key);
                });
                return _.filter(layouts, function (layout) {
                    return (failedLayouts.indexOf(layout.id) > -1);
                });
            });
        };
        /**
         * load layout widgets
         * @param layout
         */
        self.loadLayoutWidgets = function (layout) {
            var layoutId = layout.hasOwnProperty('id') ? layout.id : layout;
            return $http
                .get((urlService.layouts + '/' + layoutId + '/widgets'), _currentOrganization(), {excludeLoading: true})
                .then(function (result) {
                    var layoutWidgets = generator.generateCollection(result.data.rs, LayoutWidget);
                    layoutWidgets = generator.interceptReceivedCollection('LayoutWidget', layoutWidgets);
                    return layoutWidgets;
                });
        };
        /**
         * load layout widgets options
         * @param layout
         */
        self.loadLayoutWidgetsOptions = function (layout) {
            var layoutId = layout.hasOwnProperty('id') ? layout.id : layout;
            return $http
                .get((urlService.layouts + '/' + layoutId + '/options'), _currentOrganization(), {excludeLoading: true})
                .then(function (result) {
                    var layoutWidgetOptions = generator.generateCollection(result.data.rs, LayoutWidgetOption);
                    layoutWidgetOptions = generator.interceptReceivedCollection('LayoutWidgetOption', layoutWidgetOptions);
                    return layoutWidgetOptions;
                })
        };
        /**
         * add new Layout Widgets Options.
         * @param layoutWidgetOption
         */
        self.addLayoutWidgetOption = function (layoutWidgetOption) {
            return $http
                .post((urlService.layouts + '/options'),
                    generator.interceptSendInstance('LayoutWidgetOption', layoutWidgetOption))
                .then(function (result) {
                    layoutWidgetOption.id = result.data.rs;
                    return generator.generateInstance(layoutWidgetOption, LayoutWidgetOption);
                });
        };

        self.updateLayoutWidgetOption = function (layoutWidgetOption) {
            return $http
                .put((urlService.layouts + '/options'),
                    generator.interceptSendInstance('LayoutWidgetOption', layoutWidgetOption))
                .then(function (result) {
                    return generator.generateInstance(layoutWidgetOption, LayoutWidgetOption);
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param layout
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateLayout = function (layout, editMode) {
            var layoutsToFilter = angular.copy(self.layouts);
            if (editMode) {
                layoutsToFilter = _.filter(layoutsToFilter, function (layoutToFilter) {
                    return layoutToFilter.id !== layout.id;
                });
            }
            return _.some(_.map(layoutsToFilter, function (existingLayout) {
                // if existing layout doesn't have name, change them to empty strings
                existingLayout.arName = existingLayout.arName ? existingLayout.arName : '';
                existingLayout.enName = existingLayout.enName ? existingLayout.enName : '';

                // if layout has arName and enName, check them
                if (layout.arName && layout.enName) {
                    return existingLayout.arName === layout.arName
                        || existingLayout.enName.toLowerCase() === layout.enName.toLowerCase();
                }
                else if (!layout.arName && layout.enName) {
                    return existingLayout.enName.toLowerCase() === layout.enName.toLowerCase();
                }
                else if (layout.arName && !layout.enName)
                    return existingLayout.arName === layout.arName;

                /*return existingLayout.arName === layout.arName
                    || existingLayout.enName.toLowerCase() === layout.enName.toLowerCase();*/
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };
        /**
         * get widget by id
         * @param widget
         */
        self.getWidgetById = function (widget) {
            var widgetId = widget.hasOwnProperty('id') ? widget.id : widget;
            return _.find(self.widgets, function (widget) {
                return Number(widget.id) === Number(widgetId);
            });
        };

        self.prepareLayoutWidget = function (widget, layoutWidget, itemOrder) {
            self.lastInsertedLayoutWidget = new LayoutWidget({
                layoutId: layoutWidget.layoutId,
                widgetId: widget.id,
                widget: widget,
                parent: layoutWidget.id || null,
                itemOrder: itemOrder
            });
            return self;
        };

        self.addLayoutWidget = function () {
            var layoutWidget = self.lastInsertedLayoutWidget;
            return $http
                .post(
                    (urlService.layouts + '/' + layoutWidget.layoutId + '/widgets'),
                    generator.interceptSendInstance('LayoutWidget', layoutWidget)
                ).then(function (result) {
                    self.lastInsertedLayoutWidget = null;
                    layoutWidget.id = result.data.rs;
                    return generator.generateInstance(layoutWidget, LayoutWidget);
                });
        };
        /**
         * delete layoutWidget from layout
         * @param layoutWidget
         * @return {Promise}
         */
        self.deleteLayoutWidget = function (layoutWidget) {
            return $http.delete((urlService.layouts + '/' + layoutWidget.layoutId + '/widgets/' + layoutWidget.id));
        };
        /**
         * sort layout widgets
         * @param layoutWidgets
         * @return {Promise}
         */
        self.sortLayoutWidgets = function (layoutWidgets) {
            var layoutId = layoutWidgets[0].layoutId;
            return $http.post((urlService.layouts + '/' + layoutId + '/sorting'), _.map(layoutWidgets, 'id'));
        };
        /**
         * get array of layout elements
         * @return {Array}
         */
        self.getDefaultLayoutElements = function () {
            return _.filter(self.widgets, function (widget) {
                return widget.layoutElement;
            });
        };
        /**
         * get array of layout Widgets
         * @return {Array}
         */
        self.getLayoutWidgets = function () {
            return _.filter(self.widgets, function (widget) {
                return !widget.layoutElement;
            });
        };

        self.controllerMethod = {
            layoutAdd: function ($event) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('layout'),
                        controller: 'layoutPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            editMode: false,
                            layout: null
                        }
                    });
            },
            layoutEdit: function (layout, $event) {
                return dialog
                    .showDialog({
                        template: cmsTemplate.getPopup('layout'),
                        controller: 'layoutPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
                        locals: {
                            editMode: true,
                            layout: layout
                        }
                    });
            }
        }

    });
};