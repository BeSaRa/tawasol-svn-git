module.exports = function (app) {
    app.factory('ImageCompression', function () {
        'ngInject';
        this.AutoDetect = 0;
        this.None = 1;
        this.G4 = 4;
        this.Lzw = 5;
        this.Jpeg = 6;
        this.Zip = 50013;
        this.Jpeg2000 = 50016;
        return this;

    })
};