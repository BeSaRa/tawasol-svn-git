module.exports = function (app) {
    app.factory('LinkedObject', function (CMSModelInterceptor,
                                          _) {
        'ngInject';
        return function LinkedObject(model) {
            var self = this;
            self.name = null;
            self.mobileNumber = null;
            self.typeId = null;
            self.qid = null;
            self.employeeNum = null;
            self.crNumber = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [],
                linkedTypes = {
                    EXTERNAL_USER: ['typeId', 'name', 'mobileNumber'],
                    EMPLOYEE: ['typeId', 'name', 'mobileNumber', 'qid', 'employeeNum'],
                    COMPANY: ['typeId', 'name', 'mobileNumber', 'crNumber'],
                    OTHER: ['typeId', 'name', 'mobileNumber']
                },
                defaultTypes = [
                    'EXTERNAL_USER',
                    'EMPLOYEE',
                    'COMPANY'
                ];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            LinkedObject.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            LinkedObject.prototype.getLinkedTypeFields = function (linkedType) {
                var type = linkedType.hasOwnProperty('lookupStrKey') ? linkedType.lookupStrKey : linkedType;
                return defaultTypes.indexOf(type) === -1 ? linkedTypes.OTHER : linkedTypes[type];
            };

            LinkedObject.prototype.preparedType = function () {
                var self = this;
                var properties = this.getLinkedTypeFields(this.typeId);
                _.map(self, function (item, key) {
                    if (properties.indexOf(key) === -1 && typeof self[key] !== 'function') {
                        delete self[key];
                    }
                });
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('LinkedObject', 'init', this);
        }
    })
};