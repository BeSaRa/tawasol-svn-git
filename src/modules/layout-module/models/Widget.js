module.exports = function (app) {
    app.factory('Widget', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function Widget(model) {
            var self = this,
                maps = {
                    id: 'Id',
                    tag: 'Tag',
                    tagClass: 'TagClass',
                    minFlexSize: 'MinFlexSize',
                    layoutElement: 'LayoutElement',
                    flexSize: 'FlexSize',
                    arName: 'ArName',
                    enName: 'EnName',
                    widgetImage: 'WidgetImage'
                };
            self.id = null;
            self.tag = null;
            self.tagClass = null;
            self.minFlexSize = null;
            self.layoutElement = null;
            self.flexSize = null;
            self.arName = null;
            self.enName = null;
            self.widgetImage = null;


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Widget.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            Widget.prototype.mapReceived = function () {
                var self = this;
                _.map(maps, function (currentProperty, newProperty) {
                    self[newProperty] = self[currentProperty];
                    delete self[currentProperty];
                });
                return self;
            };
            Widget.prototype.mapSend = function () {
                var self = this;
                _.map(maps, function (currentProperty, newProperty) {
                    self[currentProperty] = self[newProperty];
                    delete self[newProperty];
                });
                return self;
            };
            Widget.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Widget', 'init', this);
        }
    })
};