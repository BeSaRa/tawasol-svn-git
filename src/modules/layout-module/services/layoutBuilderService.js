module.exports = function (app) {
    app.service('layoutBuilderService', function (_, $compile, $rootScope, LangWatcher, layoutService) {
        'ngInject';
        var self = this;
        self.serviceName = 'layoutBuilderService';
        // layout container
        self.$layoutContainer = null;
        // default layout elements container
        self.$defaultLayoutElementsContainer = null;
        // default layout elements
        self.defaultLayoutelements = [];
        // default widgets
        self.defaultLayoutWidgets = [];
        // widgets container
        self.$widgetsContainer = null;
        // current layout
        self.currentLayout = null;
        // here we will store the children element for each element in layout.
        self.childrenElements = {};
        // here we will store just the parent elements.
        self.parentElements = [];
        // remove Element Scope
        self.removeElementScope = $rootScope.$new();
        // widgets scopes
        self.widgetsScopes = {};
        /**
         * to set layout container to start build the layout on top of it.
         * @param container
         * @return {layoutBuilderService}
         */
        self.setLayoutContainer = function (container) {
            self.$layoutContainer = container;
            self.$layoutContainer.addClass('layout-builder');
            return self;
        };
        /**
         * set default widgets container to draw default layout element
         * @param container
         * @return {layoutBuilderService}
         */
        self.setDefaultLayoutElementsContainer = function (container) {
            self.$defaultLayoutElementsContainer = container;
            self.$defaultLayoutElementsContainer.addClass('default-layout-element-container-builder');
            return self;
        };
        /**
         * set default layout elements.
         * @param elements
         * @return {*}
         */
        self.setDefaultLayoutElements = function (elements) {
            self.defaultLayoutelements = elements;
            return self;
        };
        /**
         * to set widgets container to start build widgets on top of it.
         * @param container
         * @return {layoutBuilderService}
         */
        self.setWidgetsContainer = function (container) {
            self.$widgetsContainer = container;
            return self;
        };
        /**
         * to set default layout widgets .
         * @param widgets
         * @return {layoutBuilderService}
         */
        self.setDefaultLayoutWidgets = function (widgets) {
            self.defaultLayoutWidgets = _.chunk(widgets, 2);
            return self;
        };
        /**
         * set current layout to be ready for rendering.
         * @param layout
         * @return {layoutBuilderService}
         */
        self.setLayout = function (layout) {
            self.currentLayout = angular.copy(layout);
            return self;
        };
        /**
         * separate the parent from children
         * @return {*}
         */
        self.prepareLayoutHierarchy = function () {
            self.parentElements = [];
            self.childrenElements = {};
            _.map(self.currentLayout.elements, function (element) {
                if (element.parent) {
                    var parent = element.parent;
                    if (!self.childrenElements.hasOwnProperty(parent)) {
                        self.childrenElements[parent] = [];
                    }
                    self.childrenElements[parent].push(element);
                } else {
                    self.parentElements.push(element);
                }
            });
            return self;
        };
        /**
         * get children for each element in given collection.
         * @param elements
         * @return {*}
         */
        self.getChildrenElements = function (elements) {
            for (var i = 0; i < elements.length; i++) {
                var id = elements[i].id;
                if (self.childrenElements.hasOwnProperty(id)) {
                    elements[i].children = self.childrenElements[id];
                } else {
                    elements[i].children = [];
                }
                self.getChildrenElements(elements[i].children);
            }
            return self;
        };

        function _createRow() {
            return angular.element('<div />', {class: 'widget-row'}).attr('layout', 'row').attr('flex', '');
        }

        function _createWidget(widget) {
            var title = '{{widget[lang.current+\'Name\']}}';
            var imageSrc = 'assets/images/widgets/{{widget.widgetImage ? widget.widgetImage : widget.tag +\'.png\'}}';
            var column = angular.element('<div />', {class: 'widget-column'}).attr('layout', 'column');
            column.append(angular.element('<label />').html(title));
            column.append(angular.element('<div />').append(angular.element('<img />', {class: 'widget-image'}).attr('ng-src', imageSrc)));

            return angular.element('<div />', {class: 'widget-element widget'})
                .attr('flex', '50')
                .append(column)
                .attr('layout-draggable', 'img')
                .data('layoutElement', widget);
        }

        function _createWidgetScope(widget) {
            var scope = null;
            if (self.widgetsScopes.hasOwnProperty(widget.id)) {
                scope = self.widgetsScopes[widget.id];
            } else {
                scope = $rootScope.$new();
                scope.widget = widget;
                LangWatcher(scope);
            }
            return scope;
        }

        self.drawDefaultLayoutWidgets = function () {
            var length = self.defaultLayoutWidgets.length;
            self.$widgetsContainer.html('');
            var rowScope = $rootScope.$new();
            for (var i = 0; i < length; i++) {
                var row = $compile(_createRow())(rowScope);
                _.map(self.defaultLayoutWidgets[i], function (widget) {
                    var scope = _createWidgetScope(widget);
                    var widgetElement = _createWidget(widget);
                    row.append($compile(widgetElement)(scope));
                });
                self.$widgetsContainer.append(row);
            }
            return self;
        };
        /**
         * start render current layout
         */
        self.renderLayout = function () {
            return self
                .prepareLayoutHierarchy()
                .drawDefaultLayoutElements()
                .drawDefaultLayoutWidgets()
                .getChildrenElements(self.parentElements)
                .render();
        };

        self.drawDefaultLayoutElements = function () {
            self.$defaultLayoutElementsContainer.html('');
            var scope = $rootScope.$new();
            scope.elements = [];
            LangWatcher(scope);
            var row = _findRow(), cF1 = _findCol(100), cF7 = _findCol(75), cF5 = _findCol(50), cF2 = _findCol(25);
            scope.elements.push(row, cF1, cF7, cF5, cF2);
            var rowElement = _getDefaultElement(row, 0);
            rowElement.find('#row--0').append(_getDefaultElement(cF1, 1));
            rowElement.find('#row--1').append(_getDefaultElement(cF2, 4)).append(_getDefaultElement(cF7, 2));
            rowElement.find('#row--2').append(_getDefaultElement(cF5, 3)).append(_getDefaultElement(cF5, 3));
            self.$defaultLayoutElementsContainer.append($compile(rowElement)(scope));
            return self;
        };

        function _getDefaultElement(widget, index) {
            var element = angular.element('<div />', {class: widget.tag + ' ' + widget.tagClass});
            var translate = '{{elements[' + index + '][lang.current+"Name"]}}';
            element.data('layoutElement', widget);
            element.append(angular.element('<label />', {
                id: 'layout-element-' + index,
                class: 'layout-element-title'
            }).append(angular.element('<span />').html(translate)));
            if (widget.tag === 'row') {
                var column = angular.element('<div />').attr('layout', 'column');
                element.attr('flex', '');
                element.attr('layout', 'column');
                column.append(angular.element('<div />', {id: 'row--0'}).attr('layout', 'row'));
                column.append(angular.element('<div />', {id: 'row--1'}).attr('layout', 'row'));
                column.append(angular.element('<div />', {id: 'row--2'}).attr('layout', 'row'));
                element.append(column);
            } else {
                element.attr('flex', widget.flexSize);
            }
            element.attr('layout-draggable', '');
            return element;
        }


        /**
         * draw an element to layout
         */
        self.drawElement = function (widget, container) {
            var element = _getElement(widget);
            var scope = $rootScope.$new();
            scope.widget = widget;
            if (self.currentLayout.options.hasOwnProperty(widget.id)) {
                scope.options = self.currentLayout.options[widget.id];
            }
            element = $compile(element)(scope);
            if (widget.hasOwnProperty('children')) {
                for (var i = 0; i < widget.children.length; i++) {
                    self.drawElement(widget.children[i], element);
                }
            }
            container.append(element);
        };
        /**
         * final render for the layout
         * @return {*}
         */
        self.render = function () {
            self.$layoutContainer.html('');
            for (var i = 0; i < self.parentElements.length; i++) {
                self.drawElement(self.parentElements[i], self.$layoutContainer);
            }
            return self;
        };


        // to create layout elements
        function _getLayoutElement(relation) {
            var widget = relation.widget;
            var element = angular.element('<div />', {class: widget.tag + ' ' + widget.tagClass});
            if (widget.tag === 'row') {
                element.attr('layout-gt-xs', 'row');
                element.attr('layout', 'column');
                element.attr('flex', '');
                element.attr('layout-sortable', '');
            } else {
                element.attr('flex-gt-xs', widget.flexSize);
                element.attr('flex', '');

            }
            element.attr('layout-droppable', '');
            element.data('relation', relation);
            var removeBtn = angular.element('<remove-layout-element />', {class: 'remove-layout-element'});
            element.append(removeBtn);
            return element;
        }

        // to create widget elements
        function _getWidgetElement(widget) {
            return angular.element('<' + widget.widget.tag + '/>', {class: 'widget'});
        }

        function _getElement(widget) {
            return widget.widget.layoutElement ? _getLayoutElement(widget) : _getWidgetElement(widget);
        }

        /**
         * find row from defaultElements.
         * @private
         */
        function _findRow() {
            return _.find(self.defaultLayoutelements, function (item) {
                return item.tag === 'row';
            });
        }

        /**
         * find column by flexSize from defaultElements.
         * @param flexSize
         * @private
         */
        function _findCol(flexSize) {
            return _.find(self.defaultLayoutelements, function (item) {
                return item.flexSize === flexSize && item.tag === 'column';
            });
        }


    });
};