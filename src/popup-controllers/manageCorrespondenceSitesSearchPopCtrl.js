module.exports = function (app) {
    app.controller('manageCorrespondenceSitesSearchPopCtrl', function (_,
                                                                       dialog,
                                                                       $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSitesSearchPopCtrl';
        $timeout(function () {
            self.siteTypeCopy = angular.copy(self.selectedSiteType);
            self.documentCopy = angular.copy(self.document);
        });

        self.checkDisabled = function ($event) {
            return !(self.document.sitesInfoTo && self.document.sitesInfoTo.length
                || (self.document.sitesInfoCC && self.document.sitesInfoCC.length)
            )
        };

        self.returnCorrespondenceSites = function ($event) {
            var mainSiteLabel, subSiteLabel;
            if (self.document.sitesInfoTo && self.document.sitesInfoTo.length)
                mainSiteLabel = self.document.sitesInfoTo[0].getTranslatedParentName();
            else if (self.document.sitesInfoCC && self.document.sitesInfoCC.length)
                mainSiteLabel = self.document.sitesInfoCC[0].getTranslatedParentName();

            if (self.document.sitesInfoTo && self.document.sitesInfoTo.length)
                subSiteLabel = self.document.sitesInfoTo[0].getTranslatedName();
            else if (self.document.sitesInfoCC && self.document.sitesInfoCC.length)
                subSiteLabel = self.document.sitesInfoCC[0].getTranslatedName();

            dialog.hide({
                siteType: self.selectedSiteType,
                document: self.document,
                mainSiteLabel: mainSiteLabel,
                subSiteLabel: subSiteLabel
            });
        };

        self.closePopup = function ($event) {
            var mainSiteLabel, subSiteLabel;
            if (self.documentCopy.sitesInfoTo && self.documentCopy.sitesInfoTo.length)
                mainSiteLabel = self.documentCopy.sitesInfoTo[0].getTranslatedParentName();
            else if (self.documentCopy.sitesInfoCC && self.documentCopy.sitesInfoCC.length)
                mainSiteLabel = self.documentCopy.sitesInfoCC[0].getTranslatedParentName();

            if (self.documentCopy.sitesInfoTo && self.documentCopy.sitesInfoTo.length)
                subSiteLabel = self.documentCopy.sitesInfoTo[0].getTranslatedName();
            else if (self.documentCopy.sitesInfoCC && self.documentCopy.sitesInfoCC.length)
                subSiteLabel = self.documentCopy.sitesInfoCC[0].getTranslatedName();

            dialog.cancel({
                siteType: self.siteTypeCopy,
                document: self.documentCopy,
                mainSiteLabel: mainSiteLabel,
                subSiteLabel: subSiteLabel
            });
        }

    });
};