module.exports = function (app) {
    app.factory('PixColorFormat', function () {
        'ngInject';
        var self = this;
        self.Unknown = 0;
        self.BlackWhite = 1;
        self.Gray4 = 2;
        self.Gray8 = 3;
        self.Rgb = 4;

        self.getFormatName = function (colorFormat) {
            if (Number(colorFormat) === self.BlackWhite) {
                return "Black and White";
            }
            else if (Number(colorFormat) === self.Gray4) {
                return "16-level Gray";
            }
            else if (Number(colorFormat) === self.Gray8) {
                return "256-level Gray";
            }
            else if (Number(colorFormat) === self.Rgb) {
                return "24-bit Color";
            }
            return "Unknown color format";
        };

        self.getColorsFormat = function () {
            return [0, 1, 2, 3, 4];
        };

        return self;

    });
};