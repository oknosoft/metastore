/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_content
 */

$p.iface.view_content = function (cell) {

	function view_content(){
		// http://html.metaphorcreations.com/apex/
		$p.iface._content = {};
		cell.attachHTMLString(require("content"));
		cell.cell.querySelector(".dhx_cell_cont_sidebar").style.overflow = "auto";
	}

	if(!$p.iface._content)
		view_content();

	return $p.iface._content;

};
