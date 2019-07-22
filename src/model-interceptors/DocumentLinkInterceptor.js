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

            var expirationTime = new Date(model.expirationTime.getFullYear(), model.expirationTime.getMonth(), model.expirationTime.getDate(), 23, 59, 59, 999);
            model.expirationTime = generator.getTimeStampFromDate(expirationTime);

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.expirationTime = generator.getDateFromTimeStamp(model.expirationTime);

            return model;
        });
    })
};
