module.exports = function (app) {
    app.factory('Theme', function (CMSModelInterceptor, 
                                   Selector, 
                                   langService, 
                                   _) {
        'ngInject';
        return function Theme(model) {
            var self = this,
                maps = {
                    sidebar: function (item) {
                        return item.name === 'sidebar';
                    },
                    sidebarSelected: function (item) {
                        return item.name === 'sidebar_selected_item';
                    },
                    sidebarSelectedParent: function (item) {
                        return item.name === 'sidebar_selected_item_parent';
                    },
                    sidebarToolbar: function (item) {
                        return item.name === 'sidebar_toolbar';
                    },
                    toolbar: function (item) {
                        return item.name === 'toolbar';
                    },
                    pageHeader: function (item) {
                        return item.name === 'page_header';
                    },
                    sidebarSecondLevel: function (item) {
                        return item.name === 'sidebar_second_level_menu';
                    }
                },
                selectors = {
                    sidebar: new Selector('#main-sidebar'),
                    sidebar_toolbar: new Selector('#main-sidebar .sidebar-toolbar'),
                    sidebar_selected_item: new Selector('#main-sidebar li.sidebar-menu-item.active-menu:not(.has-child)'),
                    sidebar_selected_item_parent: new Selector('#main-sidebar li.sidebar-menu-item.active-menu.has-child'),
                    toolbar: new Selector('#main-toolbar'),
                    page_header: new Selector('.background-tall, .background-short'),
                    sidebar_second_level_menu: new Selector('#main-sidebar ul.sidebar-menu.menu-level-2')
                };

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'arFontFamily',
                'enFontFamily',
                'colors',
                'properties'
            ];
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.arFontFamily = null;
            self.enFontFamily = null;
            self.arFontSize = 222;
            self.enFontSize = 33;
            self.properties = [];
            self.status = false;
            self.colors = [];
            // will remove after
            self.theme = {};

            function _getCssProperty(item) {
                if (!item)
                    return;
                return item.selector.element + '{' + item.selector.property + ':' + item.value + '!important}';
            }


            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Theme.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            Theme.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };
            Theme.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };
            Theme.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            Theme.prototype.getDocumentClass = function () {
                return _.map(_.map(this.lookupStrKey, 'lookupStrKey'), function (documentClass) {
                    return langService.get(documentClass.toLowerCase());
                }).join(', ');
            };
            /**
             * Set arFontFamily
             * @returns [collection]
             */
            Theme.prototype.arFonts = function () {
                return [
                    'Arial',
                    'Droid Arabic Kufi'
                ];
            };
            /**
             * Set enFontFamily
             * @returns [collection]
             */
            Theme.prototype.enFonts = function () {
                return [
                    'Roboto Condensed',
                    'Arial',
                    'Arial Black',
                    'Comic Sans MS',
                    'Courier New',
                    'Georgia',
                    'Verdana'
                ];
            };

            Theme.prototype.mapReceived = function () {
                var self = this;
                _.map(maps, function (callback, key) {
                    self.theme[key] = _.find(_.map(self.themeKeys, function (item) {
                        var value = item.parent ? item.parent.propertyValue : 'transparent';
                        return {
                            name: item.lookupStrKey.toLowerCase(),
                            value: value,
                            selector: selectors[item.lookupStrKey.toLowerCase()]
                        }
                    }), callback);
                });
            };

            Theme.prototype.mapSend = function () {
                delete this.theme;
                return this;
            };

            Theme.prototype.getCssText = function () {
                var css = '';
                var self = this;
                _.map(Object.keys(self.theme), function (property) {
                    css += _getCssProperty(self.theme[property]);
                });
                return css;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Theme', 'init', this);
        }
    })
};
