module.exports = function (app) {
    app.factory('errorCode', function ($q) {
        'ngInject';

        var errorCodes = {
            EMPTY_RESULT: 2014,
            CAN_NOT_DELETE_LOOKUP: 3014,
            WORK_ITEM_NOT_FOUND: 2043,
            ENTITY_NOT_FOUND: 12000,
            AUTHORIZE_FAILED: 3008,
            ROOT_ENTITY_NOT_FOUND: 1001,
            FILE_NOT_ALLOWED : 2041,
            SIZE_EXTENSION_NOT_ALLOWED: 2006
        };

        return {
            checkIf: function (error, errorCode, callback) {
                var code = error.hasOwnProperty('data') ? error.data.ec : error;
                if (code === errorCodes[errorCode]) {
                    return callback();
                }
                return $q.reject(error);
            }
        }
    })
};