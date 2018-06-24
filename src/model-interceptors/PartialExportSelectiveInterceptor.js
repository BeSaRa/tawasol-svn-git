module.exports = function (app) {
    app.run(function (CMSModelInterceptor, PartialExportCollection, _, generator) {
        'ngInject';
        var modelName = 'PartialExportSelective';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setPartialExportCollection(PartialExportCollection);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.mapSend();
            if (model.exportItems.RELATED_OBJECTS && model.exportItems.RELATED_OBJECTS.length)
                model.exportItems.RELATED_OBJECTS = generator.interceptSendCollection('LinkedObject', model.exportItems.RELATED_OBJECTS)
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};