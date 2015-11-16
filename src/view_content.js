/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_content
 */

$p.iface.set_view_content = function (cell) {

	if($p.iface._content)
		return;

	// http://html.metaphorcreations.com/apex/
	$p.iface._content = {};
	cell.attachHTMLString("<div>Статьи пока не написаны</div>");

};
