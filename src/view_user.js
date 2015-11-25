/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_user
 */

$p.iface.view_user = function (cell) {

	function view_user(){
		$p.iface._user = {};
		cell.attachHTMLString(require("user"));
		cell.cell.querySelector(".dhx_cell_cont_sidebar").style.overflow = "auto";
	}

	if(!$p.iface._user)
		view_user();

	return $p.iface._user;

};
