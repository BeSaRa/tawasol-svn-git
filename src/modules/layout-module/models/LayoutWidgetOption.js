module.exports = function (app) {
    app.factory('LayoutWidgetOption', function (CMSModelInterceptor, $timeout) {
        'ngInject';
        return function LayoutWidgetOption(model) {
            var self = this,
                layoutService,
                emptyValue = null,
                maps = {
                    id: 'Id',
                    layoutWidgetId: 'LayoutWidgetId',
                    optionKey: 'OptionKey',
                    optionValue: 'OptionValue'
                };
            self.id = null;
            self.layoutWidgetId = null;
            self.optionKey = null;
            self.optionValue = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            LayoutWidgetOption.prototype.setLayoutService = function (service) {
                layoutService = service;
                return this;
            };

            LayoutWidgetOption.prototype.mapReceived = function () {
                var self = this;
                _.map(maps, function (currentProperty, newProperty) {
                    self[newProperty] = self[currentProperty];
                    delete self[currentProperty];
                });
                return self;
            };

            LayoutWidgetOption.prototype.mapSend = function () {
                var self = this;
                _.map(maps, function (currentProperty, newProperty) {
                    self[currentProperty] = self[newProperty];
                    delete self[newProperty];
                });
                return self;
            };
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            LayoutWidgetOption.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            LayoutWidgetOption.prototype.setLayoutWidgetId = function (widget) {
                this.layoutWidgetId = widget.hasOwnProperty('id') ? widget.id : widget;
                return this;
            };
            LayoutWidgetOption.prototype.setInCaseOfEmptyValue = function (value) {
                emptyValue = value;
                return this;
            };
            LayoutWidgetOption.prototype.setOptionValue = function (value) {
                this.optionValue = value;
                return this;
            };
            LayoutWidgetOption.prototype.createLayoutWidgetOption = function () {
                return layoutService.addLayoutWidgetOption(this);
            };
            LayoutWidgetOption.prototype.updateLayoutWidgetOption = function () {
                var self = this;
                if (!self.optionValue)
                    self.optionValue = emptyValue;

                return layoutService.updateLayoutWidgetOption(this);
            };
            LayoutWidgetOption.prototype.save = function () {
                return !this.id ? this.createLayoutWidgetOption() : this.updateLayoutWidgetOption();
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('LayoutWidgetOption', 'init', this);
        }
    })
};