module.exports = function (app) {
    app.factory('FileType', function () {
        'ngInject';
        var FileType = this;
        FileType.AutoDetect = 0;
        FileType.Tiff = 196608;
        FileType.Jpeg = 720896;
        FileType.Pdf = 1048576;
        FileType.Png = 1245184;
        FileType.Jpeg2000 = 1310720;
        return FileType;
    })
};