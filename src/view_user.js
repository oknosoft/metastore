/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_user
 */

$p.iface.set_view_user = function (cell) {

	if($p.iface._user)
		return;

	$p.iface._user = {};
	cell.attachHTMLString("<div>Пользователь не авторизован</div>");

};
