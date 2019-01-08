module.exports = function (app) {
    app.service('singleNotifierService', function ($q) {
        'ngInject';
        var self = this;
        self.serviceName = 'singleNotifierService';

        self.notifiers = {
            EMPLOYEE_PERMISSION_CHANGE: $q.defer(),
            ADD_ORGANIZATION: $q.defer(),
            EDIT_ORGANIZATION: $q.defer()
        };

        self.getNotifierByName = function (name) {
            return self.notifiers.hasOwnProperty(name) ? self.notifiers[name] : self.notifiers[name] = $q.defer();
        };

    });
};
