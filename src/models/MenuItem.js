module.exports = function (app) {
    app.factory('MenuItem', function (CMSModelInterceptor) {
        'ngInject';
        return function MenuItem(model) {
            var self = this;
            self.ID = null;
            self.lang_key = null;
            self.icon = null;
            self.parent = null;
            self.link = null;
            self.state = null;
            self.icon_type = null;
            self.sort_order = null;
            self.active = null;
            self.children = [];

            if (model)
                angular.extend(this, model);

            MenuItem.prototype.hasChildrenItems = function () {
                return !!this.children.length;
            };

            CMSModelInterceptor.runEvent('MenuItem', 'init', this);

        }
    })
};