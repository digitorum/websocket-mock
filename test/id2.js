(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('Id2AbBaseMock', factory('WebSocketMock'));
    } else if (typeof exports === 'object') {
        module.exports = factory(require('../index.js'));
    } else {
        root.Id2AbBaseMock = factory(root.WebSocketMock);
    }
})(
    this,
    function (WebSocketMock) {

        /**
         * Эмуляцтя сообщения от сокет сервера
         * 
         * @param {any} data - данные
         * @param {any} delay - зажержка "отправки"
         */
        function Message(data, delay) {
            this.data = typeof (data) == "string" ? data : JSON.stringify(data);
            this.delay = delay || 0;
        }

        /**
         * Обработать сообщение
         * 
         * @param {any} cb
         */
        Message.prototype.perform = function (cb) {
            var data = this.data;
            var delay = this.delay;

            setTimeout(function () {
                cb(data);
            }, delay);
        }

        //#region Base

        function Id2AbBaseMock() { }

        // Наследуемся от WebSocketMock
        Id2AbBaseMock.prototype = Object.create(WebSocketMock.getBaseMock().prototype);
        Id2AbBaseMock.prototype.constructor = Id2AbBaseMock;

        /**
         * ID сессии.
         * 
         * @type {string?}
         */
        Id2AbBaseMock.prototype.sessionId = null;

        /**
         * Токен
         * 
         * @type {string?}
         */
        Id2AbBaseMock.prototype.token = null;

        // Типы сообщений
        Id2AbBaseMock.prototype.MESSAGE_TYPEID_WELCOME = 0;
        Id2AbBaseMock.prototype.MESSAGE_TYPEID_PREFIX = 1;
        Id2AbBaseMock.prototype.MESSAGE_TYPEID_CALL = 2;
        Id2AbBaseMock.prototype.MESSAGE_TYPEID_CALL_RESULT = 3;
        Id2AbBaseMock.prototype.MESSAGE_TYPEID_CALL_ERROR = 4;
        Id2AbBaseMock.prototype.MESSAGE_TYPEID_SUBSCRIBE = 5;
        Id2AbBaseMock.prototype.MESSAGE_TYPEID_UNSUBSCRIBE = 6;
        Id2AbBaseMock.prototype.MESSAGE_TYPEID_PUBLISH = 7;
        Id2AbBaseMock.prototype.MESSAGE_TYPEID_EVENT = 8;

        /**
         * Сформировать ответы от сокет сервера
         * 
         * @param {any} data
         * @returns {Array}
         */
        Id2AbBaseMock.prototype.getResponse = function (data) {
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
                            this.token = data[4];
                            // Отправляем сообщение о том, что запрос "принят".
                            result.push(this.makeValidateCallResultMessage(data[1]));
                            // Отправляем сообщение о том, что токен валиден или не валиден.
                            result.push(this.makeValidateEventMessage());
                            break;
                        case "/getcustomuserobj":
                            // Получить кастомные свойства пользователя
                            result.push(this.makeGetCustomUserObjectCallResultMessage(data[1]));
                            break;
                        case "/getvisithistory":
                            // Получить историю просмотров
                            result.push(this.makeGetVisitVistoryCallResultMessage(data[1]));
                            break;
                        case "/loadmsgas":
                            // Загрузить список сообщений для пользователя
                            result.push(this.makeLoadMessagesCallResultMessage(data[1]));
                            // Выбрасываем список сообщений
                            result.push(this.makeLoadMessagesEventMessage());
                            break;
                        case "/writevisit":
                            // Записать посещение
                            result.push(this.makeWriteVisitCallResultMessage(data[1], data[5]));
                            break;
                        case "/getunrated2":
                            // Запросить рэйтер
                            result.push(this.makeGetUnratedCallResultMessage(data[1]));
                            // Отобразить рэйтер
                            result.push(this.makeRaterIncidentsMessage());
                            break;
                        case "/raterrate2":
                            // Отправить оценку из рэйтера
                            result.push(this.makeRaterRateCallResultMessage(data[1]));
                            break;
                        case "/senddata":
                            // Отправить некие данные
                            result.push(this.makeSendDataCallResultMessage(data[1]));
                            break;
                        case "/markread":
                            // Пометить сообщение как прочитанное
                            result.push(this.makeMarkReadCallResultMessage(data[1]));
                            break;
                        default:
                            throw "method `::methodname::` not implemented".replace("::methodname::", data[2])
                    }
                    break;
                default:
                    throw "undefined MESSAGE_TYPEID";
            }
            return result;
        }

        //#region переопределение транспортных методов

        /**
         * При "открытии" соединения шлем сообщение "welcome"
         * 
         * @param {any} cb
         */
        Id2AbBaseMock.prototype.open = function (cb) {
            this.sessionId = [...Array(32)].map(() => Math.random().toString(36)[3]).join('');
            this.token = null;
            this.makeWelcomeMessage().perform(cb);
        }

        /**
         * При отправке запроса на сервер отправляем обратно заглушку ответа
         * 
         * @param {any} data
         * @param {any} cb
         */
        Id2AbBaseMock.prototype.send = function (data, cb) {
            this.getResponse(data).forEach(function (message) {
                message.perform(cb);
            });
        }

        //#endregion

        /**
         * Получить сообщение "Welcome"
         * 
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeWelcomeMessage = function () {
            return new Message([this.MESSAGE_TYPEID_WELCOME, this.sessionId, 1, "Ratchet\/0.4.1"]);
        }

        /**
         * Получить сообщение "Запрос validate принят"
         * 
         * @param messageId
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeValidateCallResultMessage = function (messageId) {
            return new Message([this.MESSAGE_TYPEID_CALL_RESULT, messageId, { "error": 0 }]);
        }

        /**
         * Получить сообщение "Токен валиден/Токен невалиден"
         * 
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeValidateEventMessage = function () {
            return new Message([this.MESSAGE_TYPEID_EVENT, "personal", "tokenvalid"], 100);
        }

        /**
         * Сформировать сообщение содержащее "CustomUserObject"
         * В ответ оч. страшный объект...
         * 
         * @param {any} messageId
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeGetCustomUserObjectCallResultMessage = function (messageId) {
            return new Message([this.MESSAGE_TYPEID_CALL_RESULT, messageId, { "error": 0, "data": { "A": "B" } }]);
        }

        /**
         * Сформировать сообщение содержащее "историю просмотров"
         * В ответе массив непонятной структуры...
         * 
         * @param {any} messageId
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeGetVisitVistoryCallResultMessage = function (messageId) {
            return new Message([this.MESSAGE_TYPEID_CALL_RESULT, messageId, { "error": 0, "data": [] }]);
        }

        /**
         * Сформировать сообщение содержащее "историю просмотров"
         * В ответ получаем признак "принято/не принято"
         * 
         * @param {any} messageId
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeLoadMessagesCallResultMessage = function (messageId) {
            return new Message([this.MESSAGE_TYPEID_CALL_RESULT, messageId, { "error": 0 }]);
        }

        /**
         * Сообщение сожержищее нотификации для пользователя
         * 
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeLoadMessagesEventMessage = function () {
            return new Message([this.MESSAGE_TYPEID_EVENT, "payload", {
                "cdate": "2018-05-03 15:03:15",
                "type": "msglist",
                "data": {
                    "msg": {
                        "35904491": {
                            "from": "",
                            "subj": "Сообщение с незаполненным полем from",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904492": {
                            "from": "msgexpert",
                            "subj": "Сообщение с senderclass (от издания).",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904493": {
                            "from": "msgfd",
                            "subj": "Сообщение с senderclass (от издания).",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904494": {
                            "from": "msgfirmsecret",
                            "subj": "Сообщение с senderclass (от издания).",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904495": {
                            "from": "msgforbes",
                            "subj": "Сообщение с senderclass (от издания).",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904496": {
                            "from": "",
                            "subj": "Сообщение со статусом = 2 (прочитано).",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "2",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904497": {
                            "from": "",
                            "subj": "Сообщение с inttype = 1000. Вместо даты отображается ссылка `что делать`",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "1000",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904498": {
                            "from": "msgdoc",
                            "subj": "Сообщение с заполненным полем from = msgdoc",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904499": {
                            "from": "msginvoice",
                            "subj": "Сообщение с заполненным полем from = msginvoice",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904500": {
                            "from": "msgletter",
                            "subj": "Сообщение с заполненным полем from = msgletter",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904501": {
                            "from": "msgdefault",
                            "subj": "Сообщение с заполненным полем from = msgdefault",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        },
                        "35904502": {
                            "from": "msgsupport",
                            "subj": "Сообщение с заполненным полем from = msgsupport",
                            "header": "Заголовок.",
                            "body": "Тело.",
                            "inttype": "0",
                            "status": "1",
                            "cdate": "2018-05-03 16:00:14",
                            "sortindex": "1525352414"
                        }
                    },
                    "ntf": []
                }
            }]);
        }

        /**
         * Записать посещение пользователя.
         * 
         * @param {any} messageId
         * @param {any} url
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeWriteVisitCallResultMessage = function (messageId, url) {
            return new Message([this.MESSAGE_TYPEID_CALL_RESULT, messageId, { "error": 0 }]);
        }

        /**
         * Запрашиваем рейтер.
         * 
         * @param {any} messageId
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeGetUnratedCallResultMessage = function (messageId) {
            return new Message([this.MESSAGE_TYPEID_CALL_RESULT, messageId, { "error": 0 }]);
        }

        /**
         * Эвент по которому отображается рэйтер.
         * Отображается если event.data != 'nodata'
         * 
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeRaterIncidentsMessage = function () {
            return new Message([this.MESSAGE_TYPEID_EVENT, "incidents", {
                "cdate": "2018-05-03 16:00:14",
                "descr": "Описание рэйтера"
            }], 100);
        }

        /**
         * Мессадж получаемый в случае успешной отправки оценки.
         * 
         * @param messageId
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeRaterRateCallResultMessage = function (messageId) {
            return new Message([this.MESSAGE_TYPEID_EVENT, messageId, "incidents", , { "error": 0 }]);
        }
        

        /**
         * Отправка данных.
         * 
         * @param {any} messageId
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeSendDataCallResultMessage = function (messageId) {
            return new Message([this.MESSAGE_TYPEID_CALL_RESULT, messageId, { "error": 0 }]);
        }

        /**
         * Пометить сообщение как прочтенное
         * 
         * @param {any} messageId
         * @returns {Message}
         */
        Id2AbBaseMock.prototype.makeMarkReadCallResultMessage = function (messageId) {
            return new Message([this.MESSAGE_TYPEID_CALL_RESULT, messageId, { "error": 0 }]);
        }
        
        //#endregion
        

        WebSocketMock.setMock("wss://mm.action-media.ru:8181", new Id2AbBaseMock());
    }
);