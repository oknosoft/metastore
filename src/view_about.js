/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_about
 */

$p.iface.set_view_about = function (cell) {

	if($p.iface._about)
		return;

	$p.iface._about = {};
	cell.attachHTMLString(require('about'));
	cell.cell.querySelector(".dhx_cell_cont_sidebar").style.overflow = "auto";

};
