/**
 *
 * Created 10.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_products_view
 */

/**
 * ### Визуальный компонент списка товаров
 * - Отображает dataview товаров
 * - В шапке содержит хлебные крошки и фильтр по подстроке
 * - Использует [dhtmlxLayout](http://docs.dhtmlx.com/layout__index.html) и ODynDataView
 * - Автоматически перерисовывается при изменении отбора по виду номенклатуры
 *
 * Особенность dhtmlx: экземпляр создаётся не конструктором, а функцией `attachOProductsView` (без `new`) и размещается в ячейке dhtmlXCellObject
 *
 * @class OProductsView
 * @param attr {Object} - параметры создаваемого компонента
 * @constructor
 */
dhtmlXCellObject.prototype.attachOProductsView = function(attr) {

	if(!attr)
		attr = {};



	// layout используем из-за авторазмеров. можно было бы разместить элементы на форме
	var layout = this.attachLayout({
			pattern: "2E",
			cells: [
				{id: "a", text: "Поиск", height: 62, header: false},
				{id: "b", text: "Товары", header: false}
			],
			offsets: {
				top: 0,
				right: 0,
				bottom: 0,
				left: 0
			}
		}),
		
	// пагинация
		div_pager = document.createElement('div'),

	// шапка
		div_head = document.createElement('div'),

	// контейнер строки поиска
		div_search = document.createElement('div'),

	// собственно, строка поиска
		input_search = document.createElement('input'),

	// указатель на хлебные крошки
		path;

	
	layout.cells("a").fixSize(false, true);
	div_pager.classList.add("wb-tools");

	// Область строки поиска
	(function(){
		div_head = document.createElement('div');
		layout.cells("a").attachObject(div_head);

		if($p.device_type != "desktop")
			div_head.style.padding = "4px 8px";

		// хлебные крошки
		path = new $p.iface.CatalogPath(div_head);

		// строка поиска
		div_search.className = "search";
		div_head.appendChild(div_search);
		div_search.appendChild(input_search);
		input_search.className = "search";
		input_search.type = "search";
		input_search.placeholder = "Введите артикул или текст";
		input_search.title = "Найти товар по части наименования, кода или артикула";
		input_search.onchange = function (e) {
			dhx4.callEvent("search_text_change", [this.value]);
			this.blur();
		}

	})();


	// ODynDataView
	require('templates')();
	var dataview = layout.cells("b").attachDynDataView(
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
				container: div_pager,
				size:30,
				template: "{common.prev()}<div class='paging_text'> Страница {common.page()} из #limit#</div>{common.next()}"
			},
			fields: ["ref", "name"],
			selection: {}
		});
	// подключаем пагинацию
	layout.cells("b").cell.appendChild(div_pager);

	// подключаем контекстное меню

	// подписываемся на события
	dataview.attachEvent("onAfterSelect", function (id){
		// your code here
	});
	dataview.attachEvent("onItemDblClick", function (id, ev, html){

		var hprm = $p.job_prm.parse_url();
		if(hprm.ref != id)
			$p.iface.set_hash(hprm.obj, id, hprm.frm, hprm.view);

		return false;
	});

	return dataview;
};

$p.iface.CatalogPath = function CatalogPath(parent, onclick){

	var id = undefined,
		div = document.createElement('div');
	div.className = "catalog_path";

	// Обработчик маршрутизации
	function hash_route (hprm) {
		if(id != hprm.obj){
			id = hprm.obj;

			var child,
			// получаем массив пути
				path = $p.cat.ВидыНоменклатуры.path(id);

			// удаляем предыдущие элементы
			while(child = div.lastChild){
				div.removeChild(child);
			}

			var a = document.createElement('span');
			if(path.length && path[0].presentation)
				a.innerHTML = "Раздел: ";
			else
				a.innerHTML = "Поиск во всех разделах каталога";
			div.appendChild(a);

			// строим новый путь
			while(child = path.pop()){

				if(div.children.length > 1){
					a = document.createElement('span');
					a.innerHTML = " / ";
					div.appendChild(a);
				}
				a = document.createElement('a');
				a.innerHTML = child.presentation;
				a.ref = child.ref;
				a.href = "#";
				a.onclick = onclick || function (e) {
					var hprm = $p.job_prm.parse_url();
					if(hprm.obj != this.ref)
						$p.iface.set_hash(this.ref, hprm.ref, hprm.frm, hprm.view);
					return $p.cancel_bubble(e)
				};
				div.appendChild(a);
			}

		}
	};

	parent.appendChild(div);

	// подписываемся на событие hash_route
	$p.eve.hash_route.push(hash_route);

	setTimeout(function () {
		hash_route($p.job_prm.parse_url());
	}, 50);

}