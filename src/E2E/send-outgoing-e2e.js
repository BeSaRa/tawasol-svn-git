module.exports = function (app) {
    app.run(function ($httpBackend,
                      urlService,
                      generator,
                      Response) {
        'ngInject';
        var urlWithId = new RegExp(urlService.readyToSendOutgoings + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.readyToSendOutgoings + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.readyToSendOutgoings + '/deactivate' + '\/(\\d+)');

        var sendOutgoings = [
            {
                "id": 1,
                "vsId": 1,
                "docSubject": "send subject 1",
                "documentTitle": "send doc title 1",
                "priorityLevel": 1,
                "securityLevel": 1

            },
            {
                "id": 2,
                "vsId": 2,
                "docSubject": "send subject 2",
                "documentTitle": "send doc title 2",
                "priorityLevel": 3,
                "securityLevel": 3

            },
            {
                "id": 3,
                "vsId": 3,
                "docSubject": "send subject 3",
                "documentTitle": "send doc title 3",
                "priorityLevel": 5,
                "securityLevel": 5

            }
        ];

        var response = new Response();

        // get all send outgoings
        $httpBackend
            .whenGET(urlService.readyToSendOutgoings)
            .respond(function () {
                return [200, response.setResponse(sendOutgoings)];
            });


    })
};