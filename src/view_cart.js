/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_cart
 */

$p.iface.view_cart = function (cell) {

	function view_cart(){
		$p.iface._cart = {};
		cell.attachHTMLString(require("cart"));
		cell.cell.querySelector(".dhx_cell_cont_sidebar").style.overflow = "auto";

		// подписываемся на событие добавления в корзину
		dhx4.attachEvent("order_cart", function (nom) {
			$p.record_log("");
		});
	}

	if(!$p.iface._cart)
		view_cart();

	return $p.iface._cart;


};
