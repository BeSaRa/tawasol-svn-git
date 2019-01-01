module.exports = function (app) {
    app.factory('Layout', function (CMSModelInterceptor, langService, _) {
        'ngInject';
        return function Layout(model) {
            var self = this,
                layoutService = null,
                maps = {
                    id: 'Id',
                    arName: 'ArName',
                    enName: 'EnName',
                    ouApplicationUserId: 'OUApplicationUserId',
                    isCurrent: 'IsCurrent'
                };

            self.id = null;
            self.arName = null;
            self.enName = null;
            self.applicationUserId = null;
            self.ouId = null;
            self.isCurrent = false;
            self.options = {};

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName'
            ];

            if (model)
                angular.extend(this, model);

            Layout.prototype.setLayoutService = function (service) {
                layoutService = service;
                return this;
            };
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Layout.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            Layout.prototype.mapReceived = function () {
                var self = this;
                _.map(maps, function (currentProperty, newProperty) {
                    self[newProperty] = self[currentProperty];
                    delete self[currentProperty];
                });
                return self;
            };
            Layout.prototype.mapSend = function () {
                var self = this;
                _.map(maps, function (currentProperty, newProperty) {
                    self[currentProperty] = self[newProperty];
                    delete self[newProperty];
                });
                return self;
            };

            Layout.prototype.setIsCurrent = function () {
                return layoutService.setCurrentLayout(this);
            };
            Layout.prototype.getTranslatedName = function (reverse) {
                var name = '';
                if (langService.current === 'ar') {
                    if (reverse)
                        name = this.enName ? this.enName : this.arName;
                    else
                        name = this.arName ? this.arName : this.enName;
                }
                else if (langService.current === 'en') {
                    if (reverse)
                        name = this.arName ? this.arName : this.enName;
                    else
                        name = this.enName ? this.enName : this.arName;
                }
                return name;
                //return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };
            Layout.prototype.getTranslatedIsCurrent = function () {
                return this.isCurrent ? langService.get('yes') : langService.get('no');
            };
            Layout.prototype.delete = function () {
                return layoutService.deleteLayout(this);
            };
            Layout.prototype.save = function () {
                return this.id ? layoutService.updateLayout(this) : layoutService.addLayout(this);
            };
            Layout.prototype.loadLayoutElements = function () {
                var self = this;
                return layoutService
                    .loadLayoutWidgets(this)
                    .then(function (result) {
                        self.elements = result;
                        return self.elements;
                    });
            };
            Layout.prototype.loadLayoutOptions = function () {
                var self = this;
                return layoutService
                    .loadLayoutWidgetsOptions(self)
                    .then(function (options) {
                        return self.mapLayoutOptions(options);
                    });
            };
            Layout.prototype.mapLayoutOptions = function (options) {
                var self = this;
                _.map(options, function (option) {
                    if (!self.options.hasOwnProperty(option.layoutWidgetId)) {
                        self.options[option.layoutWidgetId] = {};
                    }
                    self.options[option.layoutWidgetId][option.optionKey] = option;
                });
                return self.options;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Layout', 'init', this);
        }
    });
};