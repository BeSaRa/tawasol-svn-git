module.exports = function (app) {
    app.controller('layoutPopCtrl', function (layout,
                                              Layout,
                                              validationService,
                                              layoutService,
                                              langService,
                                              generator,
                                              employeeService,
                                              dialog,
                                              toast,
                                              $timeout,
                                              editMode,
                                              _) {
        'ngInject';
        var self = this;
        self.controllerName = 'layoutPopCtrl';

        // to check the edit mode
        self.editMode = editMode;
        // current layout to diplay the old title in case of edit.
        self.model = editMode ? angular.copy(layout) : null;
        // current layout
        self.layout = editMode ? angular.copy(layout) : new Layout({
            applicationUserId: employeeService.getEmployee().id,
            ouId: employeeService.getEmployee().getOUID()
        });
        /**
         * validation labels
         * @type {{arName: string, enName: string}}
         */
        self.validateLabels = {
            arName: 'dashboard_layout_arabic_name',
            enName: 'dashboard_layout_english_name'
        };
        /**
         * close the layout dialog
         */
        self.closeLayoutDialog = function () {
            dialog.cancel();
        };

        self.checkRequiredFields = function (model) {
            var required = model.getRequiredFields(), result = [];
            _.map(required, function (property) {
                if (!generator.validRequired(model[property])) {
                    // if one of arName or enName is filled, skip the property from required;
                    if ((property === 'arName' && !model['enName']) || (property === 'enName' && !model['arName']))
                        result.push(property);
                }
            });
            return result;
        };


        /**
         * save current layout
         */
        self.saveLayout = function () {
            validationService
                .createValidation('LAYOUT_VALIDATION')
                .addStep('check_required', true, self.checkRequiredFields, self.layout, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, layoutService.checkDuplicateLayout, [self.layout, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    self.layout.save().then(function (layout) {
                        self.layout = layout;
                        self.model = angular.copy(self.layout);
                        var message = self.editMode ? langService.get('update_success') : langService.get('add_success');
                        toast.success(message.change({name: layout.getTranslatedName()}));
                        dialog.hide(self.model);
                    });
                });
        }

    });
};