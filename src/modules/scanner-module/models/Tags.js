module.exports = function (app) {
    app.factory('Tags', function () {
        'ngInject';
        var Tags = this;
        Tags.TAG_YRESOLUTION = 0x11b;
        Tags.TAG_XRESOLUTION = 0x11a;
        Tags.TAG_PAGESIZE = 0x50e;
        Tags.TAG_SCANTYPE = 0x0514;
        Tags.TAG_SCANTYPE_AUTOMATIC = 0;
        Tags.TAG_SCANTYPE_TRANSPARENCY = 1;
        Tags.TAG_SCANTYPE_FLATBED = 2;
        Tags.TAG_SCANTYPE_FRONTONLY = 3;
        Tags.TAG_SCANTYPE_DUPLEX = 4;
        Tags.TAG_SCANTYPE_BACKFRONT = 5;
        Tags.TAG_SCANTYPE_BACKONLY = 6;
        Tags.TAG_SAMPLESPERPIXEL = 0x0115;
        Tags.TAG_BITSPERSAMPLE = 0x0102;
        Tags.TAG_PHOTOMETRICINTERPRETATION = 0x0106;
        Tags.TAG_PHOTOMETRIC_WHITE0 = 0;
        Tags.TAG_PHOTOMETRIC_WHITE1 = 1;
        Tags.TAG_PHOTOMETRIC_RGB = 2;
        Tags.TAG_PHOTOMETRIC_PALETTE = 3;
        Tags.TAG_PHOTOMETRIC_BGR = 120;
        Tags.TAG_MODE_COMBO = 0x1734;

        Tags.getScanType = function (scanType) {
            if (Number(scanType) === Tags.TAG_SCANTYPE_AUTOMATIC) {
                return "Automatic";
            }
            else if (Number(scanType) === Tags.TAG_SCANTYPE_TRANSPARENCY) {
                return "Transparency Unit";
            }
            else if (Number(scanType) === Tags.TAG_SCANTYPE_FLATBED) {
                return "Flatbed";
            }
            else if (Number(scanType) === Tags.TAG_SCANTYPE_FRONTONLY) {
                return "ADF (Front Side)";
            }
            else if (Number(scanType) === Tags.TAG_SCANTYPE_DUPLEX) {
                return "ADF (Duplex)";
            }
            else if (Number(scanType) === Tags.TAG_SCANTYPE_BACKFRONT) {
                return "ADF(Back Front)";
            }
            else if (Number(scanType) === Tags.TAG_SCANTYPE_BACKONLY) {
                return "ADF (Back Side)";
            }
            return "Unknown scan type";
        };
        return Tags;
    })
};