/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_orders
 */

$p.iface.view_orders = function (cell) {

	function view_orders(){
		$p.iface._orders = {};
		cell.attachHTMLString("<div>Нет заказов</div>");
	}

	if(!$p.iface._orders)
		view_orders();

	return $p.iface._orders;

};
