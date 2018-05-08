module.exports = function (app) {
    app.run(function (CMSModelInterceptor, userFilterService, generator) {
        'ngInject';
        var modelName = 'UserFilter';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setUserFilterService(userFilterService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.ui['key_4'].value)
                model.ui['key_4'].value = generator.getTimeStampFromDate(model.ui['key_4'].value);
            if (model.ui['key_6'].value)
                model.ui['key_6'].value = generator.getTimeStampFromDate(model.ui['key_6'].value);
            if (model.ui['key_11'].value1)
                model.ui['key_11'].value1 = generator.getTimeStampFromDate(model.ui['key_11'].value1);
            if (model.ui['key_11'].value2)
                model.ui['key_11'].value2 = generator.getTimeStampFromDate(model.ui['key_11'].value2);

            model.prepareSendUserFilter();

            delete model.selectedReceivedDateFilterType;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.prepareReceivedUserFilter();

            model.ui['key_4'].value = generator.getDateFromTimeStamp(model.ui['key_4'].value);
            model.ui['key_6'].value = generator.getDateFromTimeStamp(model.ui['key_6'].value);
            model.ui['key_11'].value1 = generator.getDateFromTimeStamp(model.ui['key_11'].value1);
            model.ui['key_11'].value2 = generator.getDateFromTimeStamp(model.ui['key_11'].value2);

            model.selectedReceivedDateFilterType = null;
            getSelectedDateType(model, ['key_4', 'key_6', 'key_11'], 'selectedReceivedDateFilterType');

            return model;
        });

        var getSelectedDateType = function (model, dateKeys, selectedDateTypeProperty) {
            var value, keyNo;
            for (var key in model.ui) {
                value = model.ui[key].hasOwnProperty('value') ? model.ui[key].value
                    : (model.ui[key].hasOwnProperty('value1') ? model.ui[key].value1 : null);

                keyNo = Number(key.substr(key.indexOf('_') + 1));

                if (dateKeys.indexOf(key) > -1 && value) {
                    model[selectedDateTypeProperty] = keyNo;
                }
            }
        };

    })
};