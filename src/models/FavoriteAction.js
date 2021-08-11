module.exports = function (app) {
    app.factory('FavoriteAction', function (CMSModelInterceptor) {

        'ngInject';
        return function FavoriteAction(model) {
            var self = this;
            self.actionId = null;
            self.actionInfo = null;
            self.id = null;
            self.itemOrder = null;
            self.userId = null;

            if (model)
                angular.extend(this, model);

            CMSModelInterceptor.runEvent('FavoriteAction', 'init', this);
        }
    })
};
