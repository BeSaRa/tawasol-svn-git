module.exports = function (app) {
    app.provider('versionService', function () {
        'ngInject';
        var provider = this,
            versionNumber,
            buildNumber,
            privateBuildNumber;

        provider.setVersionNumber = function (number) {
            versionNumber = number;
            return provider;
        };

        provider.setBuildNumber = function (number) {
            buildNumber = number;
            return provider;
        };

        provider.setPrivateBuildNumber = function (number) {
            privateBuildNumber = number;
            app.$_privateBuildNumber = privateBuildNumber;
            return provider;
        };

        this.$get = function () {
            'ngInject';
            return {
                getBuildNumber: function () {
                    return buildNumber;
                },
                getPrivateBuildNumber: function () {
                    return privateBuildNumber;
                },
                getVersionNumber: function () {
                    return versionNumber;
                }
            };
        };
    });
};
