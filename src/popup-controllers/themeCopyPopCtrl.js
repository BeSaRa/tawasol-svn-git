module.exports = function (app) {
    app.controller('themeCopyPopCtrl', function (editMode,
                                                 themeService,
                                                 themes,
                                                 theme,
                                                 lookupService,
                                                 Theme,
                                                 _,
                                                 dialog,
                                                 validationService,
                                                 generator,
                                                 langService,
                                                 toast) {
        'ngInject';
        var self = this;
        self.controllerName = 'themeCopyPopCtrl';
        self.editMode = editMode;
        self.themeKeys = lookupService.returnLookups(lookupService.themeKey);
        self.editMode = editMode;
        self.theme = new Theme(theme);
        //self.theme.arName = self.theme.arName + ' [' + langService.get('copy_ar') + ' - ' + 1 + ']';
        //self.theme.enName = self.theme.enName + ' [' + langService.get('copy') + ' - ' + 1 + ']';

        self.theme.arName = "";
        self.theme.enName = "";

        self.model = angular.copy(self.theme);
        self.colors = _.range(1, 9, 1);
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            arFontFamily: "arabic_font_family",
            enFontFamily: "english_font_family",
            color: "color_palette",
            properties: "theme_additional_properties"
        };
        /**
         * @description check additional properties
         * @param model
         * @return {Array}
         */
        self.themePropertiesLength = function (model) {
            var required = model.getRequiredFields(), result = [];
            _.map(required, function (property) {
                if (property === 'properties') {
                    var count = 0;
                    for (var i in model.themeKeys) {
                        if (model.themeKeys[i].parent)
                            count = count + 1;
                    }
                    /*if (count < 9) {
                        result.push(property);
                    }*/
                    if (count < model.themeKeys.length)
                        result.push(property);
                }
            });
            return result;
        };
        /**
         * Add new theme
         */
        self.addThemeFromCtrl = function () {
            delete self.theme.id;
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.theme, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_theme_properties', true, self.themePropertiesLength, self.theme, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, themeService.checkDuplicateTheme, [self.theme, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    self.theme.copy = true;
                    themeService.addTheme(self.theme).then(function () {
                        dialog.hide(self.theme);
                    });
                })
                .catch(function () {

                })

        };
        /**
         *
         */
        self.editThemeFromCtrl = function () {
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
                .addStep('check_required', true, generator.checkRequiredFields, self.theme, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {

                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, themeService.checkDuplicateDocumentStatus, [self.theme, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    themeService.updateTheme(self.theme).then(function () {
                        dialog.hide(self.theme);
                    });
                })
                .catch(function () {

                })
        };
        /**
         * @description close the popup
         */
        self.closePopUp = function () {
            dialog.cancel();
        };
    });
};