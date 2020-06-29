module.exports = function (app) {
    app.controller('themePopCtrl', function (editMode,
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
        self.controllerName = 'themePopCtrl';
        self.editMode = editMode;
        self.themeKeys = lookupService.returnLookups(lookupService.themeKey);
        self.editMode = editMode;
        self.theme = theme;
        self.lookupStrKey = angular.copy(self.theme.lookupStrKey);
        self.model = angular.copy(self.theme);
        self.colors = _.range(1, 9, 1);
        //self.theme.colors = [{"color": "#ef7272"}, {"color": "#ec1bf7"}, {"color": "#253df7"}, {"color": "#27d0dc"}, {"color": "#5bf53d"}, {"color": "#f9f234"}, {"color": "#f4521d"}];
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            arFontFamily: "arabic_font_family",
            enFontFamily: "english_font_family",
            color: "color_palette",
            properties: "theme_additional_properties"
        };
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
           // console.log(theme);
            validationService
                .createValidation('ADD_THEME')
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
                    themeService.addTheme(self.theme)
                        .then(function (result) {
                            dialog.hide(result);
                            toast.success(langService.get('add_success').change({name: self.theme.getTranslatedName()}));
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
                .addStep('check_duplicate', true, themeService.checkDuplicateTheme, [self.theme, true], function (result) {
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
                    dialog.hide();
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
