(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('WebSocketMock', factory());
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.WebSocketMock = factory();
        root.MozWebSocket = root.WebSocket = WebSocketMock.getWebSocketClass();
    }
})(
    this,
    function () {

        //#region MessageFactory

        /**
         * Фабрика для генерации собыитий
         */
        function MessageFactory() { }

        /**
         * Получить инстанс события
         * 
         * @param {any} event
         * @param {any} name
         * @param {any} data
         * @returns {object}
         */
        MessageFactory.getMessage = function (event, name, data) {
            var result = null;

            if (typeof (event) !== "undefined") {
                if (event.prototype.constructor.name === "MessageEvent") {
                    result = new event(name, { data: data });
                } else {
                    result = new event(name, data);
                }
            } else {
                result = {
                    type: name,
                    data: data
                };
            }
            return result;
        }

        /**
         * Получить инстанс события `message`
         * 
         * @param {any} data
         * @returns {object}
         */
        MessageFactory.getMessageEvent = function (data) {
            return MessageFactory.getMessage(MessageEvent, "message", data);
        }

        /**
         * Получить инстанс события `close`
         * 
         * @param {any} data
         * @returns {object}
         */
        MessageFactory.getCloseEvent = function (data) {
            return MessageFactory.getMessage(CloseEvent, "close", data);
        }

        //#endregion

        //#region Mock

        /**
         * Базовый мок.
         * 
         * @constructor
         */
        function Mock() { };

        /**
         * Открытие с оединения
         * 
         * @param cb
         */
        Mock.prototype.open = function (cb) {
            cb();
        }

        /**
         * Отправка данных
         * 
         * @param data
         * @param cb
         */
        Mock.prototype.send = function (data, cb) {
            cb();
        }

        /**
         * Закрытие соединения
         * 
         * @param code
         * @param reason
         * @param cb
         */
        Mock.prototype.close = function (code, reason, cb) {
            cb();
        }

        //#endregion

        //#region WebSocket

        /**
         * Вебсокет...
         * Все входные параметры будут проигнорированы...
         */
        function WebSocket(url, protocols) {
            var ws = this;

            this.url = url;
            this.readyState = this.CONNECTING;
            if (protocols) {
                this.protocol = protocols[0]; // Первый доступный протокол
            }
            setTimeout(function () {
                WebSocketMock.open(ws);
            });
        }

        // The connection is not yet open.
        WebSocket.prototype.CONNECTING = 0;
        // The connection is open and ready to communicate.
        WebSocket.prototype.OPEN = 1;
        // The connection is in the process of closing.
        WebSocket.prototype.CLOSING = 2;
        // The connection is closed or couldn't be opened.
        WebSocket.prototype.CLOSED = 3;

        // A string indicating the type of binary data being transmitted by the connection. 
        // This should be either "blob" if DOM Blob objects are being used or "arraybuffer" if ArrayBuffer objects are being used.
        WebSocket.prototype.binaryType = null;
        // The number of bytes of data that have been queued using calls to send() but not yet transmitted to the network. 
        // This value resets to zero once all queued data has been sent.
        // This value does not reset to zero when the connection is closed; if you keep calling send(), this will continue to climb.Read only
        WebSocket.prototype.bufferedAmount = null;
        // The extensions selected by the server. 
        // This is currently only the empty string or a list of extensions as negotiated by the connection.
        WebSocket.prototype.extensions = null;

        // An event listener to be called when the WebSocket connection's readyState changes to CLOSED. 
        // The listener receives a CloseEvent named "close".
        WebSocket.prototype.onclose = function () { };
        // An event listener to be called when an error occurs. 
        // This is a simple event named "error".
        WebSocket.prototype.onerror = function () { };
        // An event listener to be called when a message is received from the server. 
        // The listener receives a MessageEvent named "message".
        WebSocket.prototype.onmessage = function () { };
        // An event listener to be called when the WebSocket connection's readyState changes to OPEN; this indicates that the connection is ready to send and receive data. 
        // The event is a simple one with the name "open".
        WebSocket.prototype.onopen = function () { };
        // A string indicating the name of the sub-protocol the server selected; this will be one of the strings specified in the protocols parameter when creating the WebSocket object.
        WebSocket.prototype.protocol = "";
        // The current state of the connection; this is one of the Ready state constants. Read only.
        WebSocket.prototype.readyState = null;
        // he URL as resolved by the constructor. 
        // This is always an absolute URL.Read only.
        WebSocket.prototype.url = null;

        // Closes the WebSocket connection or connection attempt, if any. If the connection is already CLOSED, this method does nothing.
        WebSocket.prototype.close = function (code, reason) {
            WebSocketMock.close(this, code, reason);
        };
        // Enqueues the specified data to be transmitted to the server over the WebSocket connection, increasing the value of bufferedAmount by the number of bytes needed to contain the data.
        // If the data can't be sent (for example, because it needs to be buffered but the buffer is full), the socket is closed automatically.
        WebSocket.prototype.send = function (data) {
            WebSocketMock.send(this, data);
        };

        // ...
        WebSocket.prototype.addEventListener = WebSocket.prototype.dispatchEvent = WebSocket.prototype.removeEventListener = function () { };

        //#endregion

        //#region WebSocketMock

        /**
         * Мок вэбсокета.
         */
        function WebSocketMock() { }

        /**
         * Набор моков (по урлу)
         * 
         * @type {array}
         */
        WebSocketMock.mocks = {};

        /**
         * Действия выполняемые при "открытии" соединения
         * 
         * @param {any} ws
         */
        WebSocketMock.open = function (ws) {
            WebSocketMock.getMock(ws.url).open(function (message) {
                ws.readyState = ws.OPEN;
                ws.onopen();
                if (message) {
                    ws.onmessage(MessageFactory.getMessageEvent(message));
                }
            });
        }

        /**
         * Действия выполняемые при закрытии содединения
         * 
         * @param {any} ws
         * @param {any} code
         * @param {any} reason
         */
        WebSocketMock.close = function (ws, code, reason) {
            WebSocketMock.getMock(ws.url).close(code, reason, function (message) {
                if (ws.readyState !== ws.CLOSED) {
                    ws.readyState = ws.CLOSING;
                    ws.readyState = ws.CLOSED;
                    ws.onclose && ws.onclose(MessageFactory.getCloseEvent(message));
                }
            });
        }

        /**
         * Действия при отправке данных
         * 
         * @param {any} data
         */
        WebSocketMock.send = function (ws, data) {
            WebSocketMock.getMock(ws.url).send(data, function (message) {
                if (message) {
                    ws.onmessage(MessageFactory.getMessageEvent(message));
                }
            });
        }

        /**
         * Получить ссылку на "мок"
         * 
         * @param {any} url
         * @returns {object}
         */
        WebSocketMock.getMock = function (url) {
            if (WebSocketMock.mocks[url]) {
                return WebSocketMock.mocks[url];
            }
            throw "Undefined mock";
        }

        /**
         * Записать ссылку на "мок"
         * 
         * @param {any} url
         * @param {any} mock
         * @returns {object}
         */
        WebSocketMock.setMock = function (url, mock) {
            if (WebSocketMock.mocks[url]) {
                throw "Mock olready defined";
            }
            WebSocketMock.mocks[url] = mock;
        }

        /**
         * Получить замоканую реализация вэбсокета
         * 
         * @returns {WebSocket}
         */
        WebSocketMock.getWebSocketClass = function () {
            return WebSocket;
        }

        /**
         * Получить базовый мок
         * 
         * @returns {Mock}
         */
        WebSocketMock.getBaseMock = function () {
            return Mock;
        }

        //#endregion

        return WebSocketMock;
    }
);