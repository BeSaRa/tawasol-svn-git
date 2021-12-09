module.exports = function (app) {
    app.service('validationService', function (Validation, _) {
        'ngInject';
        var self = this;

        self.validations = [];
        /**
         * get validation By name
         * @param name
         */
        self.getValidation = function (name) {
            return _.find(self.validations, function (validation) {
                return validation.name === name;
            });
        };
        /**
         * create new validation Object
         * @param name
         * @returns {Validation}
         */
        self.createValidation = function (name) {
            self.lastValidation = name;
            var validation = new Validation(name, self.validations);
            self.validations.push(validation);

            return validation;
        };
    });
};