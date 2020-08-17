module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      sequentialWorkflowService,
                      generator,
                      uuidv4) {
        'ngInject';
        var modelName = 'SequentialWFStep';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setSequentialWorkflowService(sequentialWorkflowService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.toUserId = generator.getNormalizedValue(model.toUserId, 'id');
            model.toOUID = generator.getNormalizedValue(model.toOUID, 'id');
            model.actionId = generator.getNormalizedValue(model.actionId, 'id');

            model.sendSMS = model.sendSMS || false;
            model.sendEmail = model.sendEmail || false;

            delete model.dummyId;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.dummyId = uuidv4();
            return model;
        });

    })
};
