module.exports = function (app) {
    app.service('encryptionService', function (CryptoJS) {
        'ngInject';
        var self = this;
        var iv = [0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 8];

        function _defaultEncryptionReturnCallback(encryption) {
            return encryption.key.toString(CryptoJS.enc.Base64) + ':' + encryption.ciphertext.toString(CryptoJS.enc.Base64);
        }

        /**
         * @default generate key to use it in encryption later
         * @param passwordKey
         * @param salt
         * @param keySize
         * @param iterations
         * @returns {WordArray}
         * @private
         */
        function _createEncryptionKey(passwordKey, salt, keySize, iterations) {
            passwordKey = passwordKey ? CryptoJS.enc.Utf8.parse(passwordKey) : CryptoJS.enc.Utf8.parse(Math.random().toString());
            salt = salt ? CryptoJS.enc.Utf8.parse(salt) : CryptoJS.enc.Utf8.parse(Math.random().toString());
            keySize = keySize ? keySize / 32 : 128 / 32;
            iterations = iterations ? iterations : 1000;
            return CryptoJS.PBKDF2(CryptoJS.enc.Hex.parse(passwordKey.toString()), CryptoJS.enc.Hex.parse(salt.toString()), {
                keySize: keySize,
                iterations: iterations
            });
        }

        /**
         * @description encrypt string values
         * @param value
         * @param returnCipherModel
         * @returns {*}
         */
        self.encrypt = function (value, returnCipherModel) {
            var encryption = CryptoJS.AES.encrypt(value, _createEncryptionKey(), {iv: CryptoJS.enc.Hex.parse(CryptoJS.enc.Utf8.parse(iv.join('')).toString())});
            return returnCipherModel ? encryption : _defaultEncryptionReturnCallback(encryption);
        };
        /**
         * @description decrypt given cipher text
         * @param value
         * @returns {string}
         */
        self.decrypt = function (value) {
            var cipherKey = CryptoJS.enc.Base64.parse(value.split(':').shift());
            var encryptedText = CryptoJS.enc.Base64.parse(value.split(':').pop());
            return CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                ciphertext: encryptedText
            }), cipherKey, {
                iv: CryptoJS.enc.Hex.parse(CryptoJS.enc.Utf8.parse(iv.join('')).toString())
            }).toString(CryptoJS.enc.Utf8);
        };

    });
};