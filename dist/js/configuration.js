(function () {
    angular
        .module('app')
        .config(function (urlServiceProvider) {
            'ngInject';
            urlServiceProvider
                .setEnvironment('stage')
                .setBaseUrl('dev', 'http://ibm-fn-http.moj.gov.qa/CMSServices/service')
                .setBaseUrl('stage', 'http://100.100.3.220:9080/CMSServices/service')
                .setBaseUrl('demo', 'http://78.100.174.133:9080/CMSServices/service')
                .setBaseUrl('test', 'http://eblaepm.no-ip.org:9081/CMSServices/service')
                .setBaseUrl('training', 'http://100.100.3.142:9080/CMSServices/service')
                .setBaseUrl('ibm', 'http://100.100.3.107:9080/CMSServices/service')
                .setBaseUrl('moph', 'http://10.25.255.30:9080/CMSServices/service')
                .setBaseUrl('oracle', 'http://100.100.3.197:9080/CMSServices/service');

            // External Systems
            urlServiceProvider
                .addSegment('desktopWord', 'http://localhost:4444') //  Edit in Desktop URL
                .addSegment('icn', 'http://100.100.3.229:9080') //  ICN URL
                .addSegment('report', 'http://100.100.3.201'); // Reporting Service URL
        });

})();