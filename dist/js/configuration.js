(function () {
    angular
        .module('app')
        .config(function (urlServiceProvider) {
            'ngInject';
            urlServiceProvider
                .setEnvironment('stage')
                .setBaseUrl('fix', 'http://100.100.3.220:9080/CMSService/service')
                .setBaseUrl('trunk', 'http://100.100.3.220:9080/CMSServices/service')
                .setBaseUrl('stage', 'http://MDPS-FNWEB01/CMSServices/service')
                .setBaseUrl('test', 'http://eblaepm.no-ip.org:9081/CMSServices/service')

            // External Systems
            urlServiceProvider
                .addSegment('desktopWord', 'http://localhost:4444') //  Edit in Desktop URL
                .addSegment('icn', 'http://100.100.3.229:9080') //  ICN URL
                .addSegment('report', 'http://100.100.3.201'); // Reporting Service URL
        });

})();
