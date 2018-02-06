module.exports = function (app) {
    app.factory('ISISWebErrorCode', function () {
        'ngInject';
        // Encoding is not supported by the method.
        this.UnsupportedEncoding = -33;
        // This file type is not supported although file is successfully imported.
        this.UnsupportedFileType = -32;
        // Invalid argument is passed into the method.
        this.InvalidArgument = -31;
        this.LicensedOnlyForSomeScanners = -30;
        this.NotSupportSinglePage = -29;
        this.InvalidWebToolkitState = -28;
        this.InvalidLicenseScanRestriction = -27;
        this.UserDeniedAccess = -26;
        this.WebToolkitCrash = -25;
        this.SeveralUsersAreLogged = -24;
        this.OutOfPaperError = -23;
        this.DoubleFeedError = -22;
        this.PaperJamError = -21;
        this.TokenInvalidError = -20;
        this.ImageMetadataCannotBeSavedError = -19;
        this.CommandTimeoutCheckStatusError = -18;
        this.InvalidCommandWhenProcessingError = -17;
        this.ParameterOutOfRangeError = -16;
        this.FileReadError = -15;
        this.InvalidFileTypeOrCompressionError = -14;
        this.SessionTimedOutError = -13;
        this.ScanCancelError = -12;
        this.InvalidFilenameError = -11;
        this.InvalidCommandWhenScanningError = -10;
        this.NoChoicesAvailableError = -9;
        this.IncorrectTagTypeError = -8;
        this.DriverNotLoadedError = -7;
        this.TagNotFoundError = -6;
        this.JobInvalidError = -5;
        this.SessionInvalidError = -4;
        this.SessionAlreadyOpenError = -3;
        this.InvalidLicenseError = -2;
        this.UnknownError = -1;
        return this;
    })
};
//Contains all the specific Web Toolkit errors.

