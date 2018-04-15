module.exports = function (app) {
    app.controller('propertyConfigurationPopCtrl', function (editMode,
                                                             propertyConfiguration,
                                                             PropertyConfiguration,
                                                             validationService,
                                                             propertyConfigurationService,
                                                             toast,
                                                             dialog,
                                                             generator,
                                                             moment) {
        'ngInject';
        var self = this;
        self.controllerName = 'propertyConfigurationPopCtrl';
        self.editMode = editMode;
        self.propertyConfiguration = angular.copy(propertyConfiguration);
        self.model = angular.copy(propertyConfiguration);

        self.validateLabels = {
            dataType: 'data_type',
            spName: 'sp_name',
            defaultValue: 'default_value',
            spParameters: 'sp_parameters',
            symbolicName: 'symbolic_name',
            defaultOperator: 'default_operator',
            documentClass: 'document_class'
        };
        self.dataTypes = [
            {
                text: "String",
                value: "String"
            }
            ,
            {
                text: "Integer",
                value: "Integer"
            },
            {
                text: "Date",
                value: "Date"
            }
        ];
        self.defaultOperators = [
            {
                text: "Like",
                value: "Like",
                display: function (type) {
                    return type === 'String';
                }
            },
            {
                text: "=",
                value: "Equal",
                display: function (type) {
                    return type === 'Integer' || type === 'Date' || type === 'String';
                }
            },
            {
                text: ">=",
                value: ">=",
                display: function (type) {
                    return type === 'Integer' || type === 'Date';
                }
            },
            {
                text: "<=",
                value: "<=",
                display: function (type) {
                    return type === 'Integer' || type === 'Date';
                }
            }
        ];

        /**
         * Add new Property Configuration
         */
        self.addPropertyConfigurationFromCtrl = function () {
            validationService
                .createValidation('ADD_PROPERTY_CONFIGURATION')
                .addStep('check_required', true, generator.checkRequiredFields, self.propertyConfiguration, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    propertyConfigurationService
                        .addPropertyConfiguration(self.propertyConfiguration)
                        .then(function (result) {
                            dialog.hide(true);
                        })
                });
        };

        /**
         * Edit Property Configuration
         */
        self.editPropertyConfigurationFromCtrl = function () {
            validationService
                .createValidation('EDIT_PROPERTY_CONFIGURATION')
                .addStep('check_required', true, generator.checkRequiredFields, self.propertyConfiguration, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    propertyConfigurationService
                        .updatePropertyConfiguration(self.propertyConfiguration)
                        .then(function (result) {
                            dialog.hide(true);
                        });
                });
        };

        /**
         * @description Close the popup
         */
        self.closePropertyConfigurationPopupFromCtrl = function () {
            dialog.cancel();
        };

        self.isDefaultOperatorDisabled = true;
        self.isDefaultValueDisabled = true;
        self.stringORNumber = /^[0-9ء-يA-Za-z]?([ .\/\\-]?[0-9ء-يA-Za-z]+)+$/;

        self.onDataTypeChange = function () {
            self.propertyConfiguration.defaultOperator = null;
            self.propertyConfiguration.defaultValue = null;
            self.defaultValueDatePicker = null;
            self.isDefaultOperatorDisabled = false;
            self.isDefaultValueDisabled = false;
            if (self.propertyConfiguration.dataType === "Date")
                self.stringORNumber = null;

            if (self.propertyConfiguration.dataType === "Integer")
                self.stringORNumber = /^\d+$/;
            else
                self.stringORNumber = /^[0-9ء-يA-Za-z]?([ .\/\\-]?[0-9ء-يA-Za-z]+)+$/;
        };

        self.defaultValueDatePicker = null;
        if (self.propertyConfiguration.dataType === "Date") {
            self.defaultValueDatePicker = self.propertyConfiguration.defaultValue;
        }

        self.onDefaultValueDatePickerChange = function () {
            self.defaultValueDatePicker = self.defaultValueDatePicker ? moment(self.defaultValueDatePicker).format('YYYY-MM-DD') : null;
            self.propertyConfiguration.defaultValue = self.defaultValueDatePicker;
        };

    });
};