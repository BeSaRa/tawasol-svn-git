module.exports = function (app) {
    app.factory('LayoutWidget', function (CMSModelInterceptor) {
        'ngInject';
        return function LayoutWidget(model) {
            var self = this, layoutService = null,
                maps = {
                    id: 'Id',
                    parent: 'Parent',
                    layoutId: 'LayoutId',
                    widgetId: 'WidgetId',
                    itemOrder: 'ItemOrder'
                };
            self.id = null;
            self.parent = null;
            self.layoutId = null;
            self.widgetId = null;
            self.itemOrder = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            LayoutWidget.prototype.setLayoutService = function (service) {
                layoutService = service;
                return this;
            };

            LayoutWidget.prototype.mapReceived = function () {
                var self = this;
                _.map(maps, function (currentProperty, newProperty) {
                    self[newProperty] = self[currentProperty];
                    delete self[currentProperty];
                });
                return self;
            };
            LayoutWidget.prototype.mapSend = function () {
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
            LayoutWidget.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            LayoutWidget.prototype.delete = function () {
                return layoutService.deleteLayoutWidget(this);
            };

            LayoutWidget.prototype.getWidgetTagId = function (prefix) {
                return (prefix || '') + this.widget.tag + '-' + this.id;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('LayoutWidget', 'init', this);
        }
    })
};