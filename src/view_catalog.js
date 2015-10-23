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

		});

		$p.iface._catalog.goods = document.createElement('div');
		$p.iface._catalog.layout.cells("b").attachObject($p.iface._catalog.goods);

		$p.iface._catalog.path = new (function CatalogPath (parent) {

			this.id = "";

			this.div = document.createElement('div');
			parent.appendChild(this.div);

			// Обработчик маршрутизации
			this.hash_route = function (hprm) {
				if(this.id != hprm.obj){
					this.id = hprm.obj;

					var child,
						// получаем массив пути
						path = $p.cat.Номенклатура.path(this.id);

					// удаляем предыдущие элементы
					while(child = this.div.lastChild){
						this.div.removeChild(child);
					}

					// строим новый путь
					while(child = path.pop()){
						var a;
						if(this.div.children.length){
							a = document.createElement('span');
							a.innerHTML = " / ";
							this.div.appendChild(a);
						}
						a = document.createElement('a');
						a.innerHTML = child.presentation;
						a.ref = child.ref;
						a.href = "#";
						a.onclick = function (e) {
							var hprm = $p.job_prm.parse_url();
							if(hprm.obj != this.ref)
								$p.iface.set_hash(this.ref, hprm.ref, hprm.frm, hprm.view);
							return $p.cancel_bubble(e)
						};
						this.div.appendChild(a);
					}

				}
			}

		})($p.iface._catalog.goods);

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

			$p.iface._catalog.path.hash_route(hprm);

			return false;
		});
	}
};
