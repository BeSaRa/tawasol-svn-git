module.exports = function (app) {
    app.controller('ldapProviderPopCtrl', function (dialog,
                                                    ldapProvider,
                                                    editMode,
                                                    langService,
                                                    entityService,
                                                    generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'ldapProviderPopCtrl';
        self.editMode = editMode;
        self.ldapProvider = angular.copy(ldapProvider);
        self.model = angular.copy(self.ldapProvider);


        var _connectionResult = function(result) {
            var message = result ? 'connection_success' : 'connection_fail';
            var method = result ? 'successMessage' : 'errorMessage';
            dialog[method](langService.get(message));
        };

        self.checkTestLdapConnectionEnabled = function () {
            return self.ldapProvider.serverAddress
                && self.ldapProvider.dc
                && self.ldapProvider.userName
                && self.ldapProvider.password
                && self.ldapProvider.tawasolOU;
        };

        /**
         * @description test LDAP connection
         */
        self.testLdapConnection = function () {
            entityService.ldapConnectionTest(self.ldapProvider).then(function (result) {
                _connectionResult(result);
            }).catch(function (error) {
                _connectionResult(false);
            })
        };

        self.resetLDAPProvider = function(form, $event){
            generator.resetFields(self.ldapProvider, self.model);
            form.$setUntouched();
        };

        self.sendLDAPProvider = function(){
            dialog.hide(self.ldapProvider);
        };

        /**
         * @description Close the popup
         */
        self.closePopUp = function () {
            dialog.cancel();
        };

    });
};
