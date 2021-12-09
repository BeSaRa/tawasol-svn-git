module.exports = function (app) {
    app.factory('OrganizationLogin', function () {
        'ngInject';
        return function OrganizationLogin(model) {
            var self = this;

            self.id = null;
            self.arName = null;
            self.enName = null;
            self.parent = null;

            if (model)
                angular.extend(this, model);

            OrganizationLogin.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            }
        }
    });
};