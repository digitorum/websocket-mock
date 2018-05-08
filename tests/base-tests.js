let WebSocket = require('ws');
let mock = require("../index.js");
let assert = require("assert");


describe("Base WSS tests", () => {
    let wss = null;
    let url = "ws://localhost:1313/";

    /**
     * Перед всеми тестами запускаем локальный сокет-сервер.
     * 
     * @returns {Promise}
     */
    before(() => {
        return new Promise((resolve) => {
            wss = new WebSocket.Server({
                port: 1313
            });
            wss.on('connection', function connection(ws) {
                ws.on('message', function incoming(message) {
                    setTimeout(function () {
                        ws.send('response for message: ' + message);
                    }, 10);
                });
            });
            resolve();
        });
    });

    /**
     * После всех тестов тушим сервер.
     */
    after(() => {
        wss.close();
    });

    /**
     * Проверить клиент
     * 
     * @param {any} WS
     * @param {any} constructorName
     */
    function testws(WS, constructorName) {
        let ws = null;
        let message = "Hello";
        let protocols = "echo";

        /**
         * Каждый раз создаем новый инстанс подключения
         * 
         * @returns {Promise}
         */
        beforeEach(() => {
            return new Promise((resolve) => {
                ws = new WS(url, protocols);
                ws.onopen = function () {
                    resolve();
                };
            });
        });

        /**
         * После каждого теста отключаемся
         */
        afterEach(() => {
            ws.close();
        });

        /**
         * Подписаться на сообщение
         * 
         * @param {any} cb
         */
        function onmessage(cb) {
            if (ws.on) {
                ws.on("message", cb); // nodejs
            } else if (ws.onmessage) {
                ws.onmessage = cb; // w3c
            }
        }

        it('Проверка имени конструктора', () => {
            assert.equal(ws.constructor.name, constructorName);
        });
        it('Проверка на соответствие url', () => {
            assert.equal(ws.url, url);
        });
        it('Проверка на соответствие protocol', () => {
            assert.equal(ws.protocol, protocols);
        });
        it('Отправка сообщения и получение ответа (eq)', (done) => {
            ws.send(message);
            onmessage(function (response) {
                done(assert.equal(response, 'response for message: ' + message));
            });
        });
        it('Отправка сообщения и получение ответа (not eq)', (done) => {
            ws.send(message);
            onmessage(function (response) {
                done(assert.notEqual(response, 'wrong response for message: ' + message));
            });
        });
    }

    describe("Использование WebSocket.", () => {
        testws(WebSocket, "WebSocket");
    });

    describe("Использование WS без определения мока.", () => {
        testws(mock.getWebSocketClass(WebSocket), "WebSocket");
    });

    describe("Использование WS c определением мока.", () => {
        before(() => {
            function TestMock() { }
            TestMock.prototype = Object.create(mock.getBaseMock().prototype);
            TestMock.prototype.constructor = TestMock;
            TestMock.prototype.getResponse = function (data) {
                return [this.factory.getRawMessage('response for message: ' + data)];
            }
            mock.setMock(url, new TestMock());
        });
        testws(mock.getWebSocketClass(WebSocket), "WS");
    });

});