module.exports = function (app) {
    app.run(function ($httpBackend,
                      urlService,
                      generator,
                      Response) {
        'ngInject';
        var urlWithId = new RegExp(urlService.rejectedOutgoings + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.rejectedOutgoings + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.rejectedOutgoings + '/deactivate' + '\/(\\d+)');

        var rejectedOutgoings = [
            {
                "id": 1,
                "vsId": 1,
                "docSubject": "rejected subject 1",
                "documentTitle": "rejected doc title 1",
                "priorityLevel": 1,
                "securityLevel": 1

            },
            {
                "id": 2,
                "vsId": 2,
                "docSubject": "rejected subject 2",
                "documentTitle": "rejected doc title 2",
                "priorityLevel": 3,
                "securityLevel": 3

            },
            {
                "id": 3,
                "vsId": 3,
                "docSubject": "rejected subject 3",
                "documentTitle": "rejected doc title 3",
                "priorityLevel": 5,
                "securityLevel": 5

            }
        ];

        var response = new Response();

        // get all rejected outgoings
        $httpBackend
            .whenGET(urlService.rejectedOutgoings)
            .respond(function () {
                return [200, response.setResponse(rejectedOutgoings)];
            });


    })
};