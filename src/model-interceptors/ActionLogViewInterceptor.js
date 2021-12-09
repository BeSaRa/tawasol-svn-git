module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      Information) {
        'ngInject';

        var modelName = 'ActionLogView';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.actionDate_vts;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.actionDate_vts = model.actionDate ? generator.getDateFromTimeStamp(model.actionDate, true) : '';
            model.eventTypeInfo = new Information(model.eventTypeInfo);
            model.actionByInfo = new Information(model.actionByInfo);
            model.itemTypeInfo = new Information(model.itemTypeInfo);

            return model;
        });
    })
};
