module.exports = function (app) {
    app.run(function (CMSModelInterceptor, userFilterService, generator) {
        'ngInject';
        var modelName = 'UserFilter';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setUserFilterService(userFilterService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            // Received date greater than
            if (model.ui['key_4'].value)
                model.ui['key_4'].value = generator.getTimeStampFromDate(model.ui['key_4'].value);
            // Received date less than
            else if (model.ui['key_6'].value)
                model.ui['key_6'].value = generator.getTimeStampFromDate(model.ui['key_6'].value);
            // Received date between
            else if (model.ui['key_11'].value1 && model.ui['key_11'].value2) {
                model.ui['key_11'].value1 = generator.getTimeStampFromDate(model.ui['key_11'].value1);
                model.ui['key_11'].value2 = generator.getTimeStampFromDate(model.ui['key_11'].value2);
            }
            // Due date between
            if (model.ui['key_10'].value1 && model.ui['key_10'].value2) {
                model.ui['key_10'].value1 = generator.getTimeStampFromDate(model.ui['key_10'].value1);
                model.ui['key_10'].value2 = generator.getTimeStampFromDate(model.ui['key_10'].value2);
            }
            // Due date exists
            model.ui['key_8'].value = model.ui['key_8'].value ? '-2000000000000L' : null;

            model.prepareSendUserFilter();

            /*if (model.filterCriteria[4])
                model.filterCriteria[4] = generator.getTimeStampFromDate(model.filterCriteria[4]);
            if (model.filterCriteria[6])
                model.filterCriteria[6] = generator.getTimeStampFromDate(model.filterCriteria[6]);
            if (model.filterCriteria[11]) {
                var from = model.filterCriteria[11].split(',')[0];
                var to = model.filterCriteria[11].split(',')[1];
                model.filterCriteria[6] = generator.getTimeStampFromDate(from) + ',' + generator.getTimeStampFromDate(to);
            }*/


            delete model.selectedReceivedDateFilterType;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.prepareReceivedUserFilter();

            model.selectedReceivedDateFilterType = null;
            // Received date greater than
            model.ui['key_4'].value = generator.getDateFromTimeStamp(model.ui['key_4'].value);
            // Received date less than
            model.ui['key_6'].value = generator.getDateFromTimeStamp(model.ui['key_6'].value);
            // Received date between
            model.ui['key_11'].value1 = generator.getDateFromTimeStamp(model.ui['key_11'].value1);
            model.ui['key_11'].value2 = generator.getDateFromTimeStamp(model.ui['key_11'].value2);
            getSelectedDateType(model, ['key_4', 'key_6', 'key_11'], 'selectedReceivedDateFilterType');

            // Due date between
            model.ui['key_10'].value1 = generator.getDateFromTimeStamp(model.ui['key_10'].value1);
            model.ui['key_10'].value2 = generator.getDateFromTimeStamp(model.ui['key_10'].value2);

            // Due date exists
            model.ui['key_8'].value = (model.ui['key_8'].value === '-2000000000000L');

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