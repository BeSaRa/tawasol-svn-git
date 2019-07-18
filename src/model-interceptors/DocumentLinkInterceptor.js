module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      employeeService,
                      DocumentLinkSubscriber,
                      lookupService,
                      DocumentLink,
                      generator) {
        'ngInject';
        var modelName = 'DocumentLink';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (!model.id) {
                var employee = employeeService.getEmployee();
                model.createdBy = employee.id;
                model.createdByOU = employee.getOUID();
                model.creationTime = generator.getTimeStampFromDate(new Date());
            }

            model.expirationTime = generator.getTimeStampFromDate(model.expirationTime);

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.expirationTime = generator.getDateFromTimeStamp(model.expirationTime);

            return model;
        });
    })
};
