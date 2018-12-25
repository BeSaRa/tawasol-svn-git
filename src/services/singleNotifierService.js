module.exports = function (app) {
    app.service('singleNotifierService', function ($q) {
        'ngInject';
        var self = this;
        self.serviceName = 'singleNotifierService';

        self.notifiers = {
            employeePermissionChange: $q.defer()
        };

        self.getNotifierByName = function (name) {
            return self.notifiers.hasOwnProperty(name) ? self.notifiers[name] : self.notifiers[name] = $q.defer();
        }

    });
};
