module.exports = function (app) {
    app.service('userSpecificDistributionWFService', function (urlService,
                                                               $http,
                                                               $q,
                                                               generator,
                                                               UserSpecifiedDistWF,
                                                               _) {
        'ngInject';
        var self = this;
        self.serviceName = 'userSpecificDistributionWFService';
        self.selectiveDepartments = [];
        self.selectiveDepartmentsCurrentOuAppUser = [];

        self.loadSelectiveDepartments = function (userId, ouId) {
            userId = generator.getNormalizedValue(userId, 'id');
            ouId = generator.getNormalizedValue(ouId, 'id');

            return $http.get(urlService.userSpecificDistWF + '/user/' + userId + '/ou/' + ouId).then(function (result) {
                self.selectiveDepartments = generator.generateCollection(result.data.rs, UserSpecifiedDistWF, self._sharedMethods);
                self.selectiveDepartments = generator.interceptReceivedCollection('UserSpecifiedDistWF', self.selectiveDepartments);
                return self.selectiveDepartments;
            });
        }

        self.loadSelectiveDepartmentsForCurrentOUAppUser = function () {
            return $http.get(urlService.userSpecificDistWF + '/dist/user').then(function (result) {
                self.selectiveDepartmentsCurrentOuAppUser = generator.generateCollection(result.data.rs, UserSpecifiedDistWF, self._sharedMethods);
                self.selectiveDepartmentsCurrentOuAppUser = generator.interceptReceivedCollection('UserSpecifiedDistWF', self.selectiveDepartmentsCurrentOuAppUser);
                return self.selectiveDepartmentsCurrentOuAppUser;
            });
        }

        self.saveSelectiveDepartment = function (selectiveDepartment) {
            return $http.post(urlService.userSpecificDistWF, generator.interceptSendInstance('UserSpecifiedDistWF', selectiveDepartment)
            ).then(function (result) {
                return generator.interceptReceivedInstance('UserSpecifiedDistWF', generator.generateInstance(result.data.rs, UserSpecifiedDistWF, self._sharedMethods));
            })
        };

        self.deleteSelectiveDepartment = function (selectiveDepartmentId) {
            return $http.delete(urlService.userSpecificDistWF + '/' + generator.getNormalizedValue(selectiveDepartmentId, 'id'));
        };

    });
};
