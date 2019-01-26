module.exports = function (app) {
    app.run(function (CMSModelInterceptor, PartialExportSelective) {
        'ngInject';
        var modelName = 'PartialExportCollection';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setPartialExportSelective(PartialExportSelective);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.mapSend();
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
