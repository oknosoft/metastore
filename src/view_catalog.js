/**
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_catalog
 */

$p.iface.view_catalog = function (cell) {

	// Динамический фильтр
	function prop_filter(){
		if(!$p.iface._catalog.filter)
			$p.iface._catalog.filter = $p.iface._catalog.navigation.cells("filter").attachPropFilter($p.cat.ВидыНоменклатуры);
	}

	// Карточка товара
	function product_card(cell, ref){

		if(!$p.iface._catalog.product_card)
			$p.iface._catalog.product_card = cell.attachOProductCard({
				rest_name: "Module_ИнтеграцияСИнтернетМагазином/СвойстваНоменклатуры",
				class_name: "cat.Номенклатура",
				ref: ref
			});

		cell.setActive();
	}

	// Список товаров
	function products_view(cell){
		if(!$p.iface._catalog.dataview)
			$p.iface._catalog.dataview = cell.attachOProductsView();
	}

	// Дерево видов номенклатуры
	function products_tree(cell){

		var tree = cell.attachDynTree($p.cat.ВидыНоменклатуры, {}, function () {
			$p.cat.ПредопределенныеЭлементы.by_name("ВидНоменклатуры_ПоказыватьВМагазине").Элементы.each(function (o) {
				tree.openItem(o.Элемент.ref);
			})
		});
		tree.attachEvent("onSelect", function(id){
			var hprm = $p.job_prm.parse_url();
			if(hprm.obj != id)
				$p.iface.set_hash(id, "", hprm.frm, hprm.view);
		});

		// подписываемся на событие hash_route
		function hash_route(hprm){
			if(tree){
				if(!hprm.obj)
					hprm.obj = $p.blank.guid;
				tree.selectItem(hprm.obj, false, false);
			}
		}
		$p.eve.hash_route.push(hash_route);
		setTimeout(function () {
			hash_route($p.job_prm.parse_url());
		}, 50);

		return tree;
	}

	// Разбивка в зависимости от типов устройств
	function view_catalog(){

		$p.iface._catalog = {};
		if($p.device_type == "desktop"){
			$p.iface._catalog.layout = cell.attachLayout({
				pattern: "2U",
				cells: [
					{id: "a", text: "Каталог", width: 300, header: false},
					{id: "b", text: "Товары", header: false}
				],
				offsets: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				}
			});
			$p.iface._catalog.layout.attachEvent("onResizeFinish", function(){
				dhx4.callEvent("layout_resize", [this]);
			});
			$p.iface._catalog.layout.attachEvent("onPanelResizeFinish", function(){
				dhx4.callEvent("layout_resize", [this]);
			});

			// Tabbar - дерево и фильтр
			$p.iface._catalog.navigation = $p.iface._catalog.layout.cells("a").attachTabbar({
				arrows_mode:    "auto",
				tabs: [
					{id: "tree", text: '<i class="fa fa-sitemap"></i> Разделы', active: true},
					{id: "filter", text: '<i class="fa fa-filter"></i> Фильтр'}
				]
			});

			// карусель с dataview и страницей товара
			$p.iface._catalog.carousel = $p.iface._catalog.layout.cells("b").attachCarousel({
				keys:           false,
				touch_scroll:   false,
				offset_left:    0,
				offset_top:     0,
				offset_item:    0
			});

			setTimeout(function () {
				products_view($p.iface._catalog.carousel.cells("dataview"));
			})

		}else{
			$p.iface._catalog.navigation = cell.attachTabbar({
				arrows_mode:    "auto",
				tabs: [
					{id: "tree", text: '<i class="fa fa-sitemap"></i> Разделы', active: true},
					{id: "filter", text: '<i class="fa fa-filter"></i> Фильтр'},
					{id: "goods", text: '<i class="fa fa-search"></i> Товары'}
				]
			});

			// карусель с dataview и страницей товара
			$p.iface._catalog.carousel = $p.iface._catalog.navigation.cells("goods").attachCarousel({
				keys:           false,
				touch_scroll:   false,
				offset_left:    0,
				offset_top:     0,
				offset_item:    0
			});
		}

		// страницы карусели
		$p.iface._catalog.carousel.hideControls();
		$p.iface._catalog.carousel.addCell("dataview");
		$p.iface._catalog.carousel.addCell("goods");


		// обработчик при изменении закладки таббара
		$p.iface._catalog.navigation.attachEvent("onSelect", function (id) {
			if(id=="filter")
				prop_filter();
			else if(id=="goods")
				products_view($p.iface._catalog.carousel.cells("dataview"));
			return true;
		});

		// Динамическое дерево
		$p.iface._catalog.tree = products_tree($p.iface._catalog.navigation.cells("tree"));

		// подписываемся на маршрутизацию
		$p.eve.hash_route.push(function (hprm){

			var nom = $p.cat.Номенклатура.get(hprm.ref, false, true);

			if(hprm.view == "catalog"){

				// при непустой ссылке, показываем карточку товара
				// если ссылка является номенклатурой - устанавливаем вид номенклатуры
				if(nom && !nom.empty()){

					if(hprm.obj != nom.ВидНоменклатуры.ref)
						hprm.obj = nom.ВидНоменклатуры.ref;
					if(hprm.obj != $p.iface._catalog.tree.getSelectedItemId())
						$p.iface._catalog.tree.selectItem(hprm.obj, false);

					product_card($p.iface._catalog.carousel.cells("goods"), hprm.ref);

				}
				// если указан пустой вид номенклатуры - используем текущий элемент дерева
				else if(!$p.cat.ВидыНоменклатуры.get(hprm.obj, false, true) || $p.cat.ВидыНоменклатуры.get(hprm.obj, false, true).empty()){
					if(!$p.is_empty_guid($p.iface._catalog.tree.getSelectedItemId()))
						hprm.obj = $p.iface._catalog.tree.getSelectedItemId();

				}
				// иначе - переключаемся на закладку списка
				else
					$p.iface._catalog.carousel.cells("dataview").setActive();
			}

		});

	}

	// создаём элементы
	if(!$p.iface._catalog)
		view_catalog();

	return $p.iface._catalog;
};
