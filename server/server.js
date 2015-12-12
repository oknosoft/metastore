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

	prm.data_url = '../data/';
};

/**
 * Инициализируем параметры и выполняем действия при старте
 */
$p.eve.init_node(require('../lib/alasql/alasql.js'))
	.then(function (meta) {
		console.log($p.md);
	});




