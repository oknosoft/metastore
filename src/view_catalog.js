/**
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_catalog
 */

$p.iface.set_view_catalog = function (cell) {

	// Обработчик маршрутизации
	function hash_route(hprm){

		// view отвечает за переключение закладки в SideBar
		if(hprm.obj)
			$p.iface._catalog.tree.selectItem(hprm.obj, false, false);

		$p.iface._catalog.path.hash_route(hprm);

		return false;
	}

	// Динамический фильтр
	function prop_filter(){
		if(!$p.iface._catalog.filter){

			$p.iface._catalog.filter = $p.iface._catalog.navigation.cells("filter").attachPropFilter($p.cat.Номенклатура);

		}

		return true;
	}

	if($p.iface._catalog)
		return;

	$p.iface._catalog = {
		layout: cell.attachLayout({
			pattern: "3L",
			cells: [
				{id: "a", text: "Каталог", width: 300, header: false},
				{id: "b", text: "Поиск", height: 70, header: false},
				{id: "c", text: "Товары", header: false}
			],
			offsets: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			}
		})
	};
	$p.iface._catalog.layout.cells("b").fixSize(false, true);

	// Tabbar - дерево и фильтр
	$p.iface._catalog.navigation = $p.iface._catalog.layout.cells("a").attachTabbar({
		arrows_mode:    "auto",
		tabs: [
			{id: "tree", text: "Разделы", active: true},
			{id: "filter", text: "Фильтр"}
		]
	});
	$p.iface._catalog.navigation.attachEvent("onSelect", prop_filter);

	// Динамическое дерево
	$p.iface._catalog.tree = $p.iface._catalog.navigation.cells("tree").attachDynTree($p.cat.Номенклатура);
	$p.iface._catalog.tree.attachEvent("onSelect", function(id){

		var hprm = $p.job_prm.parse_url();
		if(hprm.obj != id)
			$p.iface.set_hash(id, hprm.ref, hprm.frm, hprm.view);

	});


	// Область строки поиска
	(function(){
		$p.iface._catalog.goods = document.createElement('div');
		$p.iface._catalog.layout.cells("b").attachObject($p.iface._catalog.goods);

		// хлебные крошки
		$p.iface._catalog.path = new (function CatalogPath (parent) {

			this.id = undefined;

			this.div = document.createElement('div');
			this.div.style.marginTop = "-4px";
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

					var a = document.createElement('span');
					if(path.length && path[0].presentation)
						a.innerHTML = "Раздел: ";
					else
						a.innerHTML = "Поиск во всех разделах каталога";
					this.div.appendChild(a);

					// строим новый путь
					while(child = path.pop()){

						if(this.div.children.length > 1){
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
			};

			setTimeout(function () {
				hash_route($p.job_prm.parse_url());
			}, 50);

		})($p.iface._catalog.goods);

		// строка поиска
		$p.iface._catalog.top = document.createElement('div');
		$p.iface._catalog.goods.appendChild($p.iface._catalog.top);

		$p.iface._catalog.search = document.createElement('div');
		$p.iface._catalog.search.className = "search";
		$p.iface._catalog.top.appendChild($p.iface._catalog.search);

		$p.iface._catalog.search_input = document.createElement('input');
		$p.iface._catalog.search_input.className = "search";
		$p.iface._catalog.search_input.type = "search";
		$p.iface._catalog.search_input.placeholder = "Введите артикул или текст";
		$p.iface._catalog.search.appendChild($p.iface._catalog.search_input);

		$p.iface._catalog.search_button = document.createElement('button');
		$p.iface._catalog.search_button.className = "search";
		$p.iface._catalog.search_button.innerHTML = "Найти";
		$p.iface._catalog.search.appendChild($p.iface._catalog.search_button);
	})();

	// карусель с dataview и страницей товара
	$p.iface._catalog.carousel = $p.iface._catalog.layout.cells("c").attachCarousel({
		keys:           false,
		touch_scroll:   false,
		offset_left:    0,
		offset_top:     0,
		offset_item:    0
	});
	$p.iface._catalog.carousel.hideControls();
	$p.iface._catalog.carousel.addCell("dataview");
	$p.iface._catalog.carousel.addCell("goods");

	// пагинация
	$p.iface._catalog.div_pager = document.createElement('div');
	$p.iface._catalog.div_pager.classList.add("wb-tools");

	// DataView
	function getImageStyle(o){
		if(o.ФайлКартинки != $p.blank.guid){

		}
		return "";
	}
	require('templates')(getImageStyle);
	$p.iface._catalog.dataview = $p.iface._catalog.carousel.cells("dataview").attachDynDataView(
		{
			rest_name: "Module_ИнтеграцияСИнтернетМагазином/СписокНоменклатуры/",
			class_name: "cat.Номенклатура"
		},
		{
			type: "list",
			custom_css: true,
			autowidth: 1,
			//height:"auto",
			pager: {
				container: $p.iface._catalog.div_pager,
				size:30,
				template: "{common.prev()}<div class='paging_text'> Страница {common.page()} из #limit#</div>{common.next()}"
			},
			fields: ["ref", "name"],
			selection: {}
	});

	$p.iface._catalog.carousel.cells("dataview").cell.appendChild($p.iface._catalog.div_pager);


	$p.eve.hash_route.push(hash_route);
};
