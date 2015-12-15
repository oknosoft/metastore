/**
 *
 * Created 12.12.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author    Evgeniy Malyarov
 * @module  server
 */

/**
 * Подключаем metadata.js
 * @type {MetaEngine}
 */
var $p = require('../lib/metadata.core.js');

/**
 * Задаём базовые параметры нашего приложения
 * @param prm
 * @param modifiers
 */
$p.settings = function (prm, modifiers) {

	// для транспорта используем rest, а не сервис http
	prm.rest = true;
	prm.irest_enabled = true;

	// разделитель для localStorage
	prm.local_storage_prefix = "webshop_";

	// расположение rest-сервиса ut
	prm.rest_path = "/a/ut11/odata/standard.odata/";

	// расположение socket-сервера
	//prm.ws_url = "ws://localhost:8001";

	// по умолчанию, обращаемся к зоне %%%
	prm.zone = 0;

	// расположение файлов данных
	prm.data_url = "../data/";

	prm["1c"] =  {
		username: "БахшиевПИ (руководитель)",
		password: "",
		watchdog_timer: 300000,
		sync_timer: 30000
	};
	prm["1c"].auth = "Basic " + new Buffer(prm["1c"].username + ":" + prm["1c"].password).toString("base64");

	prm.network = {
		//http:   require('http'),
		//https:  require('https'),
		"1c":   8003,   //8003 - через этот порт 1С получает списки синонимов и метаданных и регистрирует изменения
		md:     0,      //8002 - порт, через который сервер взаимодействует с веб-приложениями metadata.js
		adm:    8004,   //8004 - порт административного интерфейса a-la конфигуратор 1С с деревом метаданных
		socket: 0       //8001 - порт websocket сервера для взаимодействия с 1С и веб-приложениями metadata.js
	}

	var pg_cnn = "postgres://md:md@localhost/md",
		pg_drv = require('pg');

	$p.wsql.postgres = function (pg_callback) {
		return pg_drv.connect(pg_cnn, pg_callback);
	};

};

/**
 * Инициализируем параметры и выполняем действия при старте
 */
$p.eve.init_node(require('../lib/alasql/alasql.js'))
	.then(function (meta) {
		
		// если указано использование взаимодействия с 1С - инициализируем
		if($p.job_prm.network["1c"])
			require('./http_1c.js')($p);
	})
	.catch(function (err) {
		console.log(err);
	});




