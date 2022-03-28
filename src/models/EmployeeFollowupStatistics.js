module.exports = function (app) {
    app.factory('EmployeeFollowupStatistics', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function EmployeeFollowupStatistics(model) {
            var self = this,
                exportData = {
                    count: 'count',
                    arabic_full_name: function () {
                        return this.userInfo.arName;
                    },
                    english_full_name: function () {
                        return this.userInfo.enName;
                    }
                };
            self.count = 0;
            self.oUInfo = null;
            self.userInfo = null;

            if (model)
                angular.extend(this, model);

            EmployeeFollowupStatistics.prototype.getExportedData = function () {
                return exportData;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('EmployeeFollowupStatistics', 'init', this);
        }
    });
};
