module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      generator,
                      SequentialWFStep,
                      lookupService,
                      _) {
        'ngInject';
        var modelName = 'SequentialWF';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.regOUId = generator.getNormalizedValue(model.regOUId, 'id');
            model.creatorId = generator.getNormalizedValue(model.creatorId, 'id');
            model.creatorOUId = generator.getNormalizedValue(model.creatorOUId, 'id');
            model.docClassID = generator.getNormalizedValue(model.docClassID, 'lookupKey');

            // assign stepRows to steps to send to service
            model.steps = generator.interceptSendCollection('SequentialWFStep', model.stepRows);

            delete model.docClassInfo;
            delete model.stepRows;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.docClassInfo = _.find(lookupService.returnLookups(lookupService.documentClass), function (item) {
                return item.lookupKey === model.docClassID;
            }) || new Information();

            model.stepRows = []; // will be used throughout the sequential workflow popup
            if (model.steps && model.steps.length) {
                model.steps = generator.interceptReceivedCollection('SequentialWFStep', generator.generateCollection(model.steps, SequentialWFStep));
                model.stepRows = angular.copy(model.steps);
            }
            return model;
        });

    })
};
