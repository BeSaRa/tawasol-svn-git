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
            "password",
            "isSSL"
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
                    "password": model.password,
                    "isSSL": model.isSSL
                }
            ];
            // In case of edit, the g2gPassword and internalG2gPassword will only be sent if entered by user to override.
            // If not entered, properties will be removed from object.
            if (model.id) {
                if (model.g2gServerAddress && !model.g2gPassword)
                    delete model.g2gPassword;
                if (model.internalG2gServerAddress && !model.internalG2gPassword)
                    delete model.internalG2gPassword;
            }
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