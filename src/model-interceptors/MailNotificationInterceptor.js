module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      generator,
                      Information) {
        'ngInject';
        var modelName = 'MailNotification';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.actionInfo = new Information(model.actionInfo);
            model.senderInfo = new Information(model.senderInfo);
            model.receivedDate = generator.getDateFromTimeStamp(model.receivedDate , true);
            return model;
        });


    })
};