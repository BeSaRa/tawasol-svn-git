module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'Entity';

        /**
         * @description Contains the properties which will be used as ldapProviders properties
         * @type {[string]}
         */
        var ldapProperties = [
            "serverAddress",
            "dc",
            "tawasolOU",
            "userName",
            "password"
        ];

        /**
         * @description Remove the given properties from the model
         * @param model
         * @param properties
         * @returns {model}
         */
        var removeTemporaryProperties = function (model, properties) {
            if (typeof properties === "string")
                delete model[properties];
            else {
                for (var i = 0; i < properties.length; i++) {
                    if (typeof properties[i] === "string")
                        delete model[properties[i]];
                }
            }
            return model;
        };

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.smtpPort = model.smtpPort ? Number(model.smtpPort) : null;
            model.ldapProviders = [
                {
                    "serverAddress": model.serverAddress,
                    "dc": model.dc,
                    "tawasolOU": model.tawasolOU,
                    "userName": model.userName,
                    "password": model.password
                }
            ];
            removeTemporaryProperties(model, ldapProperties);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (model.ldapProviders.length) {
                for (var i = 0; i < ldapProperties.length; i++) {
                    model[ldapProperties[i]] = model.ldapProviders[0][ldapProperties[i]]
                }
            }
            removeTemporaryProperties(model, 'ldapProviders');
            return model;
        });

    })
};