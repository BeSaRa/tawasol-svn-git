module.exports = function (app) {
    app.controller('landingPageCtrl', function (layouts,
                                                _,
                                                layoutService,
                                                layoutBuilderService,
                                                langService,
                                                contextHelpService,
                                                toast,
                                                dialog,
                                                $scope,
                                                $element,
                                                $timeout,
                                                employeeService) {
        'ngInject';
        var self = this,
            layoutContainer = '#layout-container',
            defaultWidgetsContainer = '#default-widgets-container',
            widgetsContainer = '#widgets-container';
        contextHelpService.setHelpTo('landing-page');
        self.controllerName = 'landingPageCtrl';
        // all available layouts for current user
        self.layouts = layouts;

        self.loading = false;

        self.editMode = false;

        self.layout = layoutService.getCurrentLayout();
        self.employeeService = employeeService;

        self.options = {
            from: 0,
            to: 200,
            callback: function () {
                console.log("ASDASD");
            }
        };

        function _loadLayoutWidgets() {
            if (!self.layout) {
                self.loading = false;
                return;
            }
            // start loading layout elements
            self.layout.loadLayoutElements().then(function () {
                self.layout.loadLayoutOptions().then(function () {
                    self.loading = false;
                    _renderLayout();
                });
            });
        }

        _loadLayoutWidgets();

        self.onCurrentLayoutChanged = function () {
            self.layout.setIsCurrent().then(function () {
                _loadLayoutWidgets();
            })
        };
        /**
         * toggle edit mode
         */
        self.toggleEditMode = function () {
            self.editMode = !self.editMode;
        };

        self.displayAddLayoutPopup = function ($event) {
            layoutService
                .controllerMethod
                .layoutAdd($event)
                .then(function (layout) {
                    self.layouts.push(layout);
                    if (layout.isCurrent) {
                        self.layout = layout;
                        _loadLayoutWidgets();
                    } else if (!layout.isCurrent && self.layouts.length === 1) {
                        self.layout = layout;
                        _loadLayoutWidgets();
                    }

                })
        };

        self.currentLayoutInEdit = function (layout) {
            return self.currentEdit === layout.id;
        };

        self.displayEditLayoutPopup = function ($event) {
            self.currentEdit = true;
            layoutService
                .controllerMethod
                .layoutEdit(self.layout, $event)
                .then(function (layout) {
                    var index = self.layouts.indexOf(self.layout);
                    self.layouts.splice(index, 1, layout);
                    self.currentEdit = false;
                })
                .catch(function () {
                    self.currentEdit = false;
                });
        };

        self.displayDeleteLayoutPopup = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: self.layout.arName}), null, null, $event)
                .then(function () {
                    layoutService.deleteLayout(self.layout).then(function () {
                        self.layouts = _.filter(self.layouts, function (layout) {
                            return layout.id !== self.layout.id;
                        });
                        layoutService.layouts = self.layouts;
                        if (!self.layouts.length) {
                            self.layout = null;
                        } else {
                            self.layout = self.layouts[0];
                            self.onCurrentLayoutChanged();
                        }
                        toast.success(langService.get('delete_success'));
                    });
                })
        };

        self.changeAlign = function (align) {
            var container = $element.find('#element-container');
            var classes = {
                left: 'top-left',
                right: 'top-right',
                bottom: 'bottom',
                top: 'top'
            };
            var removeClass = _.filter(classes, function (value, property) {
                return property !== align;
            });
            container.addClass(classes[align]).removeClass(removeClass.join(' '));
        };

        function _renderLayout() {
            $timeout(function () {
                layoutBuilderService
                    .setLayoutContainer($element.find(layoutContainer))
                    .setDefaultLayoutElementsContainer($element.find(defaultWidgetsContainer))
                    .setDefaultLayoutElements(layoutService.getDefaultLayoutElements())
                    .setWidgetsContainer($element.find(widgetsContainer))
                    .setDefaultLayoutWidgets(layoutService.getLayoutWidgets())
                    .setLayout(self.layout)
                    .renderLayout();
            });
        }

    });
};