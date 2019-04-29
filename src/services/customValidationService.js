module.exports = function (app) {
    app.service('customValidationService', function (_) {
        'ngInject';
        var self = this;
        self.serviceName = 'customValidationService';

        self.customValidations = [];

        self.regex = {
            /**
             * @description allow only dates with format YYYY-MM-dd
             **/
            Date: /([1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/,

            /**
             * @description Allows url format with http or https or www
             */
            url: /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?|^((http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])([:](\d{2,4}))?$/,
            /**
             * @description Allows IP format only
             */
            ip: /^((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-fA-F]|[a-fA-F][a-fA-F0-9\-]*[a-fA-F0-9])\.)*([A-Fa-f]|[A-Fa-f][A-Fa-f0-9\-]*[A-Fa-f0-9])$|^(?:(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){6})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:::(?:(?:(?:[0-9a-fA-F]{1,4})):){5})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){4})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,1}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){3})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,2}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){2})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,3}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:[0-9a-fA-F]{1,4})):)(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,4}(?:(?:[0-9a-fA-F]{1,4})))?::)(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,5}(?:(?:[0-9a-fA-F]{1,4})))?::)(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,6}(?:(?:[0-9a-fA-F]{1,4})))?::)))))$/,
            /**
             * @description Allows email format only
             */
            email: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])/,
            /**
             * @description Allows integer numbers only
             */
            // number: /^\d+$/,
            number: /^[0-9\u0660-\u0669]+$/g,
            /**
             * @description Allows phone/mobile number starting with +974 followed by 8 digits
             */
            // phone_mobile: /^\+974\d{8}$/,
            phone_mobile: /^[\\+]?[0-9]+$/,
            /**
             * @description Allows digits and decimals
             */
            ND: /^([0-9]*[1-9][0-9]*(\.[0-9]+)?|[0]*\.[0-9]*[1-9][0-9]*)$/, // /^\d*\.?\d*$/,
            /**
             * @description Allows arabic, space(not in end of string and no 2 consecutive spaces)
             */
            A: /^[ء-ي]?( ?[ء-ي]+)+$/,
            //A:  /^[0-9ء-يA-Za-z]?([ \/-]?[0-9ء-يA-Za-z]+)+$/, //(Arabic fields acceptiing arabic, english, number always)
            /**
             * @description Allows english, space(not in end of string and no 2 consecutive spaces)
             */
            E: /^[A-Za-z]?( ?[A-Za-z]+)+$/,
            /**
             * @description Allows arabic, digits
             */
            AN: /^[0-9ء-ي]+$/,
            //AN: /^[0-9ء-يA-Za-z]?([ \/-]?[0-9ء-يA-Za-z]+)+$/, //(Arabic fields acceptiing arabic, english, number always)
            /**
             * @description Allows english, digits
             */
            EN: /^[A-Za-z0-9]+$/,
            /**
             * @description Allows english, digits and underscore
             */
            EN_: /^[a-zA-Z0-9_]+$/,
            /**
             * @description Allows arabic, digits, space(not in end of string and no 2 consecutive spaces)
             */
            ANS: /^[0-9ء-ي]?( ?[0-9ء-ي]+)+$/,
            //ANS: /^[0-9ء-يA-Za-z]?([ \/-]?[0-9ء-يA-Za-z]+)+$/, //(Arabic fields accepting arabic, english, number always)

            /**
             * @description Allows at least 1 arabic character and can contain digits, space(not in end of string and no 2 consecutive spaces)
             */
            // A1NS: /^(?=.*[ء-ي])[0-9ء-ي]?( ?[0-9ء-ي]+)+$/,
            // A1NS: /(^[\u0621-\u064A0-9]+)([\u0621-\u064A ?0-9]*)$/,
            A1NS: /^(?=.*[\u0621-\u064A])[\u0621-\u064A0-9]?( ?[\u0621-\u064A0-9]+)+$/,

            /**
             * @description Allows english, digits, space(not in end of string and no 2 consecutive spaces)
             */
            ENS: /^[A-Za-z0-9]?( ?[A-Za-z0-9]+)+$/,

            /**
             * @description Allows at least 1 english character and can contain digits, space(not in end of string and no 2 consecutive spaces)
             */
            E1NS: /^(?=.*[A-Za-z])[A-Za-z0-9]?( ?[A-Za-z0-9]+)+$/,

            /**
             * @description Allows english, arabic characters, space(not in end of string and no 2 consecutive spaces)
             */
            AE: /^[A-Za-zء-ي]?( ?[A-Za-zء-ي]+)+$/,
            /**
             * @description Allows Arabic, english, digits, hyphen, forward slash
             */
            // AEN: /^[0-9ء-يA-Za-z.]?([ \/-]?[0-9ء-يA-Za-z]+)+$/,
            AEN: /^[0-9ء-يA-Za-z.]?([ \-]?[0-9ء-يA-Za-z.]+)+$/,
            /**
             * @description Allows Arabic, english, space(not in end of string and no 2 consecutive spaces)
             */
            AES: /^[ء-يA-Za-z]?( ?[ء-يA-Za-z]+)+$/,
            /**
             * @description Allows arabic, underscore(not end of string and no 2 consecutive underscores)
             */
            A_: /^[ء-ي]?(_?[ء-ي]+)+$/,
            //A_:  /^[ء-ي]?(_?[ء-يA-Za-z]+)+$/, //(Arabic fields accepting arabic, english, underscore always)
            /**
             * @description Allows english, underscore(not in end of string and no 2 consecutive underscores)
             */
            E_: /^[A-Za-z]?(_?[A-Za-z]+)+$/,
            /**
             * @description Allows english, arabic, digits, space, hyphen, dot, forward slash, backward slash
             */
            ALL: /^[0-9ء-يA-Za-z]?([ .\/\\-]?[0-9ء-يA-Za-z]+)+$/,
            /**
             * @description Allows integer value from 1 to 65535
             */
            port: /^(([1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]))$/,
            EN_DOT: /^[a-zA-Z0-9_.]+$/,
            EN_DOT_DASH: /^[a-zA-Z0-9_.\-]+$/,
            FILE_NET_USER: /^[\w]+[@.\-\w]*[\w.]+$/
        };

        /**
         * @description validate input fields on click of add/save button.
         * @param inputValueToValidate
         * @param inputType
         * @returns {*}
         */
        self.validateInput = function (inputValueToValidate, inputType) {
            if (inputValueToValidate) {
                /*if (!self.regex[inputType].test(inputValueToValidate)) {
                    return false;
                }*/
                if (inputType !== 'number') {
                    return self.regex[inputType].test(inputValueToValidate);
                } else {
                    return (/^[0-9\u0660-\u0669]+$/g).test(inputValueToValidate);
                }
            }
            return true;
        };

    });
};
