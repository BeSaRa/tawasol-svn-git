module.exports = function (app) {
    app.run(function ($httpBackend,
                      urlService,
                      generator,
                      Response) {
        'ngInject';
        var urlWithId = new RegExp(urlService.draftOutgoings + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.draftOutgoings + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.draftOutgoings + '/deactivate' + '\/(\\d+)');

        var draftOutgoings = [
            {
                "id": 1,
                "vsId": 1,
                "docSubject": "draft subject 1",
                "documentTitle": "draft doc title 1",
                "priorityLevel": 1,
                "securityLevel": 1

            },
            {
                "id": 2,
                "vsId": 2,
                "docSubject": "draft subject 2",
                "documentTitle": "draft doc title 2",
                "priorityLevel": 3,
                "securityLevel": 3

            },
            {
                "id": 3,
                "vsId": 3,
                "docSubject": "draft subject 3",
                "documentTitle": "draft doc title 3",
                "priorityLevel": 5,
                "securityLevel": 5

            }
        ];

        var response = new Response();

        // get all draft outgoings
        $httpBackend
            .whenGET(urlService.draftOutgoings)
            .respond(function () {
                return [200, response.setResponse(draftOutgoings)];
            });


    })
};