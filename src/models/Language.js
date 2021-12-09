module.exports = function (app) {
    app.factory('Language', function () {
        'ngInject';
        return function Language(model) {
            var self = this;
            self.id = null;
            self.title = null;
            self.code = null;
            self.image = null;

            if (model)
                angular.extend(this, model);
        }
    });
};