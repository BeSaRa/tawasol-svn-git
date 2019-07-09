module.exports = function (app) {
    app.factory('MenuItem', function (CMSModelInterceptor, langService) {
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
            self.open = false;
            self.children = [];

            if (model)
                angular.extend(this, model);

            MenuItem.prototype.hasChildrenItems = function () {
                return !!this.children.length;
            };
            MenuItem.prototype.toggleItem = function () {
                this.open = !this.open;
                return this;
            };
            MenuItem.prototype.closeItem = function () {
                this.open = false;
                return this;
            };
            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            MenuItem.prototype.getNameByLanguage = function (language) {
                return langService.getByLangKey(this.lang_key, language);
            };

            CMSModelInterceptor.runEvent('MenuItem', 'init', this);

        }
    })
};
