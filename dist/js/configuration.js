(function () {
    angular
        .module('app')
        .config(function (urlServiceProvider, configurationServiceProvider) {
            'ngInject';
            urlServiceProvider
                .setEnvironment('trunk')
                .setBaseUrl('fix', 'http://100.100.3.220:9080/CMSServicesFix/service')
                .setBaseUrl('trunk', 'http://100.100.3.220:9080/CMSServices/service')
                .setBaseUrl('stage', 'http://MDPS-FNWEB01/CMSServices/service')
                .setBaseUrl('testFixpack', 'http://100.100.3.162:9080/CMSServices/service')
                .setBaseUrl('testFeatures', 'http://eblaepm.no-ip.org:9080/CMSServices/service')
                .setBaseUrl('cloudFeatures', 'https://cmscloud.eblacorp.com/CMSServices/service');


            urlServiceProvider
                .addSegment('desktopWord', 'http://localhost:4444'); //  Edit in Desktop URL

            configurationServiceProvider
                //  to https connection and use HTTP instead to connect with scanner service
                .updateConfiguration('IGNORE_HTTPS_FOR_SCANNER', true)
                // delay before send request to backend to save the changes on content.
                .updateConfiguration('OFFICE_ONLINE_DELAY', 5000)
                // CORRESPONDENCE_SITES_TYPES_LOOKUPS
                .updateConfiguration('CORRESPONDENCE_SITES_TYPES_LOOKUPS', [], true)
                // Make it  false if Tawasol Deployed in Kuwait
                .updateConfiguration('G2G_QATAR_SOURCE', true)
                // just for test
                .updateConfiguration('ENABLE_ACTIVE_SENDER_LINKS', false)
                // Evaluation license PSPDF
                .updateConfiguration('PSPDF_LICENSE_KEY', false) //true = evaluation version, false = production version
                // Cahtbot Configurations
                .updateConfiguration('CHAT_BOT', {
                    URL: 'http://tawasolbot-b750.azurewebsites.net/chatbot.html?',
                    APPEND_TOKEN: true
                })
                .updateConfiguration('CUSTOM_STAMP_SIZE', {
                    width: 112,
                    height: 88
                });

        });

})();
