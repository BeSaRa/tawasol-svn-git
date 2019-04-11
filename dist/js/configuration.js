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
                .setBaseUrl('test', 'http://eblaepm.no-ip.org:9081/CMSServices/service')


            configurationServiceProvider
                .updateConfiguration('IGNORE_HTTPS_FOR_SCANNER', true);

        });

})();
