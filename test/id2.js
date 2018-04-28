(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('Id2AbMock', factory('WebSocketMock'));
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../index.js'));
    } else {
        root.Id2AbMock = factory(root.WebSocketMock);
    }
})(
    this,
    function (WebSocketMock) {

        function Id2AbMock() { }

        Id2AbMock.prototype = Object.create(WebSocketMock.getBaseMock().prototype);
        Id2AbMock.prototype.constructor = Id2AbMock;

        Id2AbMock.prototype.MESSAGE_TYPEID_WELCOME = 0;
        Id2AbMock.prototype.MESSAGE_TYPEID_PREFIX = 1;
        Id2AbMock.prototype.MESSAGE_TYPEID_CALL = 2;
        Id2AbMock.prototype.MESSAGE_TYPEID_CALL_RESULT = 3;
        Id2AbMock.prototype.MESSAGE_TYPEID_CALL_ERROR = 4;
        Id2AbMock.prototype.MESSAGE_TYPEID_SUBSCRIBE = 5;
        Id2AbMock.prototype.MESSAGE_TYPEID_UNSUBSCRIBE = 6;
        Id2AbMock.prototype.MESSAGE_TYPEID_PUBLISH = 7;
        Id2AbMock.prototype.MESSAGE_TYPEID_EVENT = 8;

        Id2AbMock.prototype.getResponse = function (data) {
            var result = [];

            if (typeof (data) == "string") {
                data = JSON.parse(data);
            }
            switch (data[0]) {
                case this.MESSAGE_TYPEID_SUBSCRIBE:
                    // Подписка на событие.
                    // Ничего не делаем.
                    break;
                case this.MESSAGE_TYPEID_CALL:
                    // Запрос данных у сокетсервера.
                    // Отправляем ответ-заглушку в зависимости от запроса...
                    switch (data[2]) {
                        case "/validate":
                            // Валидация токена.
                            // Отправляем сообщение о том, что запрос "принят".
                            result.push([this.MESSAGE_TYPEID_CALL_RESULT, data[1], { "error": 0 }]);
                            // Отправляем сообщение о том, что токен валиден.
                            result.push([this.MESSAGE_TYPEID_EVENT, "personal", "tokenvalid"]);
                            break;
                    }
                    break;
                default:
                    throw "undefined MESSAGE_TYPEID";
            }
            return result;
        }

        Id2AbMock.prototype.open = function (cb) {
            cb(JSON.stringify([0, "2733505345ae46df53719a024280634", 1, "Ratchet\/0.4.1"]));
        }

        Id2AbMock.prototype.send = function (data, cb) {
            this.getResponse(data).forEach(function (message) {
                setTimeout(function () {
                    cb(JSON.stringify(message));
                });
            });
        }

        WebSocketMock.setMock("wss://mm.action-media.ru:8181", new Id2AbMock());
    }
);