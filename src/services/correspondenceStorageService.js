module.exports = function (app) {
    app.service('correspondenceStorageService', function (correspondenceService, $q, _) {
        'ngInject';
        var self = this;
        self.serviceName = 'correspondenceStorageService';

        self.lastCorrespondence = {};

        /**
         * @description get correspondence by action name
         * @param actionName
         * @param correspondence
         */
        self.runEditAfter = function (actionName, correspondence) {
            var info = correspondence.getInfo();
            var methodName = 'correspondenceEditAfter' + actionName;
            return correspondenceService[methodName](info.documentClass, info.vsId, info.wobNumber)
                .then(function (correspondence) {
                    self.lastCorrespondence[actionName.toLowerCase()] = correspondence;
                    return true;
                });
        };
        /**
         * @description get last correspondence
         * @returns {null|*}
         */
        self.getCorrespondence = function (action) {
            var correspondence = self.lastCorrespondence[action.toLowerCase()];
            self.lastCorrespondence[action.toLowerCase()] = null;
            return correspondence ? $q.resolve(correspondence) : $q.reject();
        };

    });
};
