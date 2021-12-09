module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, DocumentType) {
        'ngInject';
        var urlWithId = new RegExp(urlService.documentTypes + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.documentTypes + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.documentTypes + '/deactivate' + '\/(\\d+)');

        var documentTypes = [];

        var response = new Response();

        // get all documentTypes
        $httpBackend
            .whenGET(urlService.documentTypes)
            .respond(function () {
                return [200, response.setResponse(documentTypes)];
            });

        // add new document Type
        $httpBackend
            .whenPOST(urlService.documentTypes)
            .respond(function (method, url, data) {
                var documentType = JSON.parse(data);
                // create new id for model
                documentType.id = generator.createNewID(documentTypes, 'id');

                // push model to collections
                documentTypes.push(documentType);
                return [200, response.setResponse(documentType.id)];
            });

        // edit document Type
        $httpBackend.whenPUT(urlService.documentTypes)
            .respond(function (method, url, data) {
                var documentType = new DocumentType(JSON.parse(data));

                for (var i = 0; i < documentTypes.length; i++) {
                    if (documentTypes[i].id === documentType.id) {
                        documentTypes[i] = documentType;
                        break;
                    }
                }

                return [200, response.setResponse(documentType)];
            });

        // delete documentTypes bulk
        $httpBackend.whenDELETE(urlService.documentTypes + '/bulk').respond(function (method, url, data) {
            var documentTypesToDelete = JSON.parse(data);

            for (var i = 0; i < documentTypesToDelete.length; i++) {
                for (var j = 0; j < documentTypes.length; j++) {
                    if (documentTypes[j].id === documentTypesToDelete[i]) {
                        documentTypes.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete documentType single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < documentTypes.length; i++) {
                if (documentTypes[i].id === parseInt(id)) {
                    documentTypes.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate documentType status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var documentType = documentTypes.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            documentType.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate documentType status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var documentType = documentTypes.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            documentType.status = false;

            return [200, response.setResponse(true)];
        });

        // activate documentType status bulk
        $httpBackend.whenPUT((urlService.documentTypes + '/activate/bulk')).respond(function (method, url, data) {
            var documentTypesToActivate = JSON.parse(data);
            for (var i = 0; i < documentTypesToActivate.length; i++) {
                for (var j = 0; j < documentTypes.length; j++) {
                    if (documentTypes[j].id === documentTypesToActivate[i]) {
                        documentTypes[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate documentType status bulk
        $httpBackend.whenPUT((urlService.documentTypes + '/deactivate/bulk')).respond(function (method, url, data) {
            var documentTypesToActivate = JSON.parse(data);
            for (var i = 0; i < documentTypesToActivate.length; i++) {
                for (var j = 0; j < documentTypes.length; j++) {
                    if (documentTypes[j].id === documentTypesToActivate[i]) {
                        documentTypes[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
