/**
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_catalog
 */

$p.iface.set_view_catalog = function (cell) {

	if(!$p.iface._catalog){
		$p.iface._catalog = {
			layout: cell.attachLayout({
				pattern: "2U",
				cells: [
					{id: "a", text: "Каталог", width: 300, header: false},
					{id: "b", text: "Товары", header: false}
				],
				offsets: {
					top: 4,
					right: 4,
					bottom: 4,
					left: 4
				}
			})
		};
		$p.iface._catalog.navigation = $p.iface._catalog.layout.cells("a").attachTabbar({
			tabs: [
				{id: "tree", text: "Разделы", active: true},
				{id: "filter", text: "Фильтр"}
			]
		});

		$p.iface._catalog.tree = $p.iface._catalog.navigation.cells("tree").attachDynTree($p.cat.Номенклатура);
		$p.iface._catalog.tree.attachEvent("onSelect", function(id){

			var hprm = $p.job_prm.parse_url();
			if(hprm.obj != id)
				$p.iface.set_hash(id, hprm.ref, hprm.frm, hprm.view);

			console.log($p.cat.Номенклатура.path(id));
		});

		$p.iface._catalog.goods = document.createElement('div');
		$p.iface._catalog.goods.innerHTML = "123";
		$p.iface._catalog.layout.cells("b").attachObject($p.iface._catalog.goods);

		/**
		 * Обработчик маршрутизации
		 * @param hprm
		 * @return {boolean}
		 */
		$p.eve.hash_route.push(function (hprm) {

			// view отвечает за переключение закладки в SideBar
			if(hprm.obj && $p.iface._catalog.tree.getSelectedItemId() != hprm.obj){
				$p.iface._catalog.tree.selectItem(hprm.obj);
			}
			return false;
		});
	}
};
