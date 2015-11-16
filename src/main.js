// This file was automatically generated from "dev.lmd.json"
(function(global,main,modules,modules_options,options){var initialized_modules={},global_eval=function(code){return global.Function("return "+code)()},global_document=global.document,local_undefined,register_module=function(moduleName,module){var output={exports:{}};initialized_modules[moduleName]=1;modules[moduleName]=output.exports;if(!module){module=module||global[moduleName]}else if(typeof module==="function"){var module_require=lmd_require;if(modules_options[moduleName]&&modules_options[moduleName].sandbox&&typeof module_require==="function"){module_require=local_undefined}module=module(module_require,output.exports,output)||output.exports}module=module;return modules[moduleName]=module},lmd_require=function(moduleName){var module=modules[moduleName];var replacement=[moduleName,module];if(replacement){moduleName=replacement[0];module=replacement[1]}if(initialized_modules[moduleName]&&module){return module}if(typeof module==="string"&&module.indexOf("(function(")===0){module=global_eval(module)}return register_module(moduleName,module)},output={exports:{}};for(var moduleName in modules){initialized_modules[moduleName]=0}main(lmd_require,output.exports,output)})
(this,(function (require, exports, module) { /* wrapped by builder */
/**
 * Фильтр по свойствам вида элементов справочника
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_filter_prop
 */

/**
 * ### Визуальный компонент для установки отборов по реквизитам (в том числе - вычисляемым), свойствам и категориям элементов справочника
 * - Отображает коллекцию элементов отбора и элементы управления с доступными значениями
 * - Унаследован от [dhtmlxForm](http://docs.dhtmlx.com/form__index.html)
 * - Автоматически обновляет состав доступных свойств при изменении отбора по родителю, выполняя запрос к irest-сервису библиотеки интеграции 1С
 *
 * Особенность dhtmlx: экземпляр создаётся не конструктором, а функцией `attachPropFilter` (без `new`) и размещается в ячейке dhtmlXCellObject
 *
 * @class OPropFilter
 * @param mgr {DataManager}
 * @param attr {Object} - параметры создаваемого компонента
 * @constructor
 */
dhtmlXCellObject.prototype.attachPropFilter = function(mgr, attr) {

	if(!attr)
		attr = {};
	var _cell = this,
		_width = _cell.getWidth ? _cell.getWidth() : _cell.cell.offsetWidth - 44,
		_add,
		_price,
		_filter_prop = {},
		_parent,
		_hprm = $p.job_prm.parse_url(),
		pf = new function OPropFilter(){
			this.children = [];
			this.form = _cell.attachForm([
				{ type:"settings" , labelWidth:120, inputWidth:120, offsetLeft: dhtmlx.skin == "dhx_web" ? 4 : 8, offsetTop: 8 },
				{ type:"container", name:"price", label:"", inputWidth: _width, inputHeight:50, position: "label-top"},
				{ type:"checkbox" , name:"store", label:"Есть на складе", labelAlign:"left", position:"label-right", tooltip: "Скрыть тованы, которых нет в наличии"  },
				{ type:"container", name:"_add", label:"Дополнительно", inputWidth: _width, inputHeight:"auto", position: "label-top"},
				{ type:"template" , name:"form_template_3", label:"Показать"  },
				{ type:"template" , name:"form_template_1", label:"Больше параметров"  }
			]);
		};

	// подключим дополнительные элементы
	//_cell.cell.firstChild.style.overflow = "auto";

	function prop_change(v){
		var changed;
		for(var key in v){
			if(!_filter_prop[key])
				changed = true;
			else if(typeof v[key] == "object"){
				for(var j in v[key])
					if(_filter_prop[key][j] != v[key][j])
						changed = true;
			}
			_filter_prop[key] = v[key];
		}
		if(changed)
			dhx4.callEvent("filter_prop_change", [_filter_prop]);
	}

	// форма
	//_form.style.width = "100%";
	//_form.style.height = "100px";
	//_cont.appendChild(_form);
	//
	//_add.style.width = "100%";
	//_add.style.height = "100%";
	//_cont.appendChild(_add);


	_add = pf.form.getContainer("_add");

	pf.__define({

		mode: {
			get: function () {

			},
			set: function (v) {

			},
			enumerable: false
		},

		// указывает на объект, определяющий набор свойств для фильтрации
		// например, на элемент справочника _ВидыНоменклатуры_
		parent: {
			get: function () {
				return _parent ? _parent.ref : "";
			},
			set: function (v) {
				// чистим содержимое контейнера
				var child,
					price_prop = {
						container: pf.form.getContainer("price"),
						on_change: prop_change,
						name: "Цена",
						synonym: "Цена",
						range: {min: 0, max: 1000000},
						start: {min: 100, max: 100000}
					};

				pf.children.forEach(function (child) {
					if(child.destructor)
						child.destructor();
				});
				while (child = _add.lastChild)
					_add.removeChild(child);

				_filter_prop = {};

				if(v == $p.blank.guid){
					// перестраиваем ценник
					if(_price){
						price_prop.range.min = 0;
						price_prop.range.max = 1000000;
						price_prop.start.min = 100;
						price_prop.start.max = 100000;
						_price.rebuild(price_prop);
					} else
						_price = new ORangeSlider(price_prop);

					return;
				}

				// получаем вид номенклатуры
				_parent = mgr.get(v);

				// слайдер цены - перестраиваем или создаём новый при старте
				price_prop.range.min = _parent.Цена_Мин > 500 ? _parent.Цена_Мин - 500 : 0;
				price_prop.range.max = _parent.Цена_Макс + 500;
				price_prop.start.min = _parent.Цена_Мин;
				price_prop.start.max = _parent.Цена_Макс;
				if(_price)
					_price.rebuild(price_prop);
				else
					_price = new ORangeSlider(price_prop);


				// уточняем производителей
				if(_parent.Производители){
					var values = _parent.Производители.split(",");
					if(values.length > 1){
						child = new OMultiCheckbox({
							container: _add,
							property: {},
							name: "Производители",
							values: values.map(function (ref) { return $p.cat.Производители.get(ref); })
						});
						pf.children.push(child);
					}
				}

				// бежим по свойствам и создаём элементы управления
				_parent.РеквизитыБыстрогоОтбораНоменклатуры.each(function (o) {
					if(o.property && !o.property.empty()){
						child = new OMultiCheckbox({
							container: _add,
							property: o.property,
							name: o.ПредставлениеРеквизита
						});
						pf.children.push(child);
					}
				});

			},
			enumerable: false
		},

		/**
		 * Обработчик маршрутизации
		 */
		hash_route: {
			value: function (hprm) {
				if(hprm.obj && pf.parent != hprm.obj){
					pf.parent = hprm.obj;


				}
			}
		}
	});


	$p.eve.hash_route.push(pf.hash_route);
	setTimeout(function () {
		pf.hash_route(_hprm);
	}, 50);

	return pf;
};

/* joined by builder */
/**
 *
 * Created 07.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author    Evgeniy Malyarov
 * @module  wdg_multi_checkbox
 */

/**
 * ### Визуальный компонент - таблица из двух колонок: чекбокс и значение
 * - Позволяет выбрать N Значений из списка
 * - Унаследован от [dhtmlXGridObject](http://docs.dhtmlx.com/grid__index.html)
 * - Автоматически строит список свойств по элементу плана видов характеристик _ДополнительныеРеквизитыИСведения_
 *
 * @class OMultiCheckbox
 * @param attr {Object} - параметры создаваемого компонента
 * @param attr.container {HTMLElement} - div, в котором будет расположен компонент
 * @param attr.property {cch.property} - Элемент плана видов характеристик _ДополнительныеРеквизитыИСведения_
 * @constructor
 */
function OMultiCheckbox(attr) {

	var _div = document.createElement("div"),
		_grid = new dhtmlXGridObject(_div);

	_div.classList.add("multi_checkbox");
	attr.container.appendChild(_div);

	// собственно табличная часть
	_grid.setIconsPath(dhtmlx.image_path);
	_grid.setImagePath(dhtmlx.image_path);
	_grid.setHeader("," + attr.name || attr.property.Заголовок || attr.property.name);
	//_grid.setNoHeader(true);
	_grid.setInitWidths("30,*");
	_grid.setColAlign("center,left");
	_grid.setColSorting("na,na");
	_grid.setColTypes("ch,ro");
	_grid.setColumnIds("ch,name");
	_grid.enableAutoWidth(true, 600, 100);
	_grid.enableAutoHeight(true, 180, true);
	_grid.init();

	if(attr.values){
		attr.values.forEach(function (o) {
			_grid.addRow(o.ref,[0, o.name]);
		})
	}else if(attr.property.type.is_ref && attr.property.type.types && attr.property.type.types.length == 1){
		$p.md.mgr_by_class_name(attr.property.type.types[0]).find_rows({owner: attr.property}, function (o) {
			_grid.addRow(o.ref,[0, o.name]);
		})
	}

	return _grid;

};



/* joined by builder */
/**
 * Фильтр по свойствам вида элементов справочника
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_range_slider
 */

/**
 * ### Визуальный компонент для установки пары min и max значений с полями ввода и ползунком
 * Унаследован от [noUiSlider](http://refreshless.com/nouislider/)
 *
 * @class ORangeSlider
 * @param attr {Object} - параметры создаваемого компонента
 * @param attr.container {HTMLElement} - div, в котором будет расположен компонент
 * @param attr.on_change {Function} - событие, которое генерирует компонент при изменении значений
 * @param attr.name {String} - Имя свойства
 * @param attr.synonym {String} - Текст заголовка
 * @param attr.tooltip {String} - Текст всплывающей подсказки
 * @param attr.range {Object} - диапазон
 * @param attr.start {Object} - начальные значения
 * @constructor
 */
function ORangeSlider(attr) {

	var _div = document.createElement("div"),
		_title = document.createElement("div"),
		_slider = document.createElement("div"),
		_min,
		_max;

	attr.container.appendChild(_div);
	_div.appendChild(_title);
	_title.style.marginBottom = "12px";
	_title.innerHTML = attr.synonym + ": <input name='min' /> - <input name='max' />"
	_min = _title.querySelector('[name=min]');
	_max = _title.querySelector('[name=max]');
	_min.style.width = "33%";
	_max.style.width = "33%";

	_div.appendChild(_slider);

	function create(){

		noUiSlider.create(_slider, {
			start: [ attr.start ? attr.start.min : 100, attr.start ? attr.start.max : 10000 ], // Handle start position
			step: attr.step || 100, // Slider moves in increments of '10'
			margin: attr.margin || 100, // Handles must be more than '20' apart
			connect: true, // Display a colored bar between the handles
			behaviour: 'tap-drag', // Move handle on tap, bar is draggable
			range: { // Slider can select '0' to '100'
				'min': attr.range ? attr.range.min : 200,
				'max': attr.range ? attr.range.max : 10000
			}
		});

		// When the slider value changes, update the input and span
		_slider.noUiSlider.on('update', function( values, handle ) {
			if ( handle ) {
				_max.value = values[handle];
			} else {
				_min.value = values[handle];
			}
			on_change();
		});
	}

	function on_change(){
		var val = {};
		val[attr.name] = [parseInt(_min.value) || 0, parseInt(_max.value) || 100000];
		attr.on_change(val);
	}

	function input_bind(){
		_slider.noUiSlider.set([_min.value, _max.value]);
		on_change();
	}

	create();

	// When the input changes, set the slider value
	_min.addEventListener('change', input_bind);
	_max.addEventListener('change', input_bind);

	_slider.rebuild = function (nattr) {
		if(nattr.range)
			attr.range = nattr.range;
		if(nattr.start)
			attr.start = nattr.start;
		_slider.noUiSlider.destroy();
		create();
	};

	return _slider;

};

/* joined by builder */
/**
 *
 * Created 09.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_product_card
 */

/**
 * ### Визуальный компонент карточки товара
 * - Отображает аккордеон с картинками и свойствами
 * - Унаследован от [dhtmlxForm](http://docs.dhtmlx.com/form__index.html)
 * - Автоматически перерисовывается при изменении ссылки номенклатуры
 *
 * Особенность dhtmlx: экземпляр создаётся не конструктором, а функцией `attachOProductCard` (без `new`) и размещается в ячейке dhtmlXCellObject
 *
 * @class OProductCard
 * @param attr {Object} - параметры создаваемого компонента
 * @param attr.ref {String|DataObj} - ссылка или номенклатура
 * @constructor
 */
dhtmlXCellObject.prototype.attachOProductCard = function(attr) {

	if(!attr)
		attr = {};

	var _cell = this,
		toolbar = _cell.attachToolbar({
			icons_size: 24,
			icons_path: dhtmlx.image_path + "dhxsidebar" + dhtmlx.skin_suffix(),
			items: [
				{type: "text", id: "title", text: "&nbsp;"},
				{type: "spacer"},
				{type: "button", id: "back", img: "back_48.png", title: "Вернуться к списку"}
			]
		}),
		accordion = _cell.attachAccordion({

			multi_mode: false,           // boolean, true to enable multimode

			items: [    // accordion cells section
				{
					id:     "main",     // item id, required
					text:   "Text",     // string, header's text (html allowed)
					open:   true,       // boolean, true to open/false to close item on init
					height: 600         // number, cell's height (multimode only)
				},
				{
					id:     "description",
					text:   "Описание и характеристики"
				},
				{
					id:     "notes",
					text:   "Комментарии, обзоры, вопрос-ответ"
				},
				{
					id:     "download",
					text:   "Драйверы и файлы"
				}
			],

			offsets: {
				top: 0,
				right: 4,
				bottom: 0,
				left: 0
			}

		}),
		_main = new CardMain(accordion.cells("main"));

	if($p.device_type != "desktop")
		accordion.cells("download").hide();

	/**
	 * Перезаполняет все ячейки аккордеона
	 * @param ref
	 */
	function requery(ref){

		// информацию про номенклатуру, полученную ранее используем сразу
		var nom = $p.cat.Номенклатура.get(ref, false);
		_main.requery_short(nom);

		// дополнительное описание получаем с сервера и перезаполняем аккордеон
		if(!nom.Файлы){
			attr.url = "";
			$p.ajax.default_attr(attr, $p.job_prm.irest_url());
			attr.url += attr.rest_name + "(guid'" + ref + "')";
			if(!nom.name)
				attr.url += "?full=true";
			if(dhx4.isIE)
				attr.url = encodeURI(attr.url);
			$p.ajax.get_ex(attr.url, attr)
				.then(function (req) {
					var data = JSON.parse(req.response);
					data.Файлы = JSON.stringify(data.Файлы);
					nom._mixin(data);
					_main.requery_long(nom);
				})
				.catch($p.record_log);
		}else
			_main.requery_long(nom);

	}

	/**
	 * Изображение, цена и кнопки купить - сравнить - добавить
	 * @param cell
	 * @constructor
	 */
	function CardMain(cell){

		var _div = document.createElement('div'),
			_img = document.createElement('div'),
			_act = document.createElement('div');
		cell.attachObject(_div);
		_div.appendChild(_img);
		_div.appendChild(_act);

		this.requery_short = function (nom) {
			cell.setText(nom.НаименованиеПолное || nom.name);
		};

		this.requery_long = function (nom) {
			var files = JSON.parse(nom.Файлы);
			if(files.length){
				// рисуем карусель
			}else{
				// одиночное изображение
			}
		};

		// подписываемся на событие изменения размера
		dhx4.attachEvent("layout_resize", function (layout) {

		});

	}

	toolbar.attachEvent("onClick", function(id){
		switch (id) {
			case "back":
				var hprm = $p.job_prm.parse_url();
				$p.iface.set_hash(hprm.obj, "", hprm.frm, hprm.view);
				break;
		}
	});

	// хлебные крошки
	var div_head = toolbar.cont.querySelector(".dhx_toolbar_text"),
		btn = toolbar.cont.querySelector(".dhxtoolbar_float_right"),
		path = new $p.iface.CatalogPath(div_head, function (e) {
			var hprm = $p.job_prm.parse_url();
			$p.iface.set_hash(this.ref, "", hprm.frm, hprm.view);
			return $p.cancel_bubble(e)
		}),
		old_css = [];
	div_head.classList.forEach(function (class_name) {
		old_css.push(class_name);
	});
	old_css.forEach(function (class_name) {
		div_head.classList.remove(class_name);
	});
	btn.style.paddingRight = "8px";

	// обработчик маршрутизации
	$p.eve.hash_route.push(function (hprm){
		if(hprm.view == "catalog" && $p.is_guid(hprm.ref) && !$p.is_empty_guid(hprm.ref))
			requery(hprm.ref);
	});

	if(attr.ref){
		requery(attr.ref);
		delete attr.ref;
	}

	return accordion;

};
/* joined by builder */
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


	var _cell = this.cell,

	// внешний контейнер
		layout = document.createElement('div'),

	// указатель на хлебные крошки
		path,

	// указатель на dataview
		dataview;


	this.attachObject(layout);

	// Область строки поиска
	(function(){

		// шапка
		var div_head = document.createElement('div'),

		// контейнер строки поиска
			div_search = document.createElement('div'),

		// собственно, строка поиска
			input_search = document.createElement('input'),

		// икона поиска
			icon_search = document.createElement('i');

		div_head.className = "md_column320";
		layout.appendChild(div_head);

		if($p.device_type != "desktop")
			div_head.style.padding = "4px 8px";

		// хлебные крошки
		path = new $p.iface.CatalogPath(div_head);

		// строка поиска
		div_search.className = "search";
		div_head.appendChild(div_search);
		div_search.appendChild(input_search);
		div_search.appendChild(icon_search);
		icon_search.className="icon_search fa fa-search";
		input_search.className = "search";
		input_search.type = "search";
		input_search.placeholder = "Введите артикул или текст";
		input_search.title = "Найти товар по части наименования, кода или артикула";
		input_search.onchange = function (e) {
			dhx4.callEvent("search_text_change", [this.value]);
			this.blur();
		}

	})();

	// Область сортировки
	(function(){

		var md_column320 = document.createElement('div'),
			sort = document.createElement('div'),
			values = [
				'по возрастанию цены <i class="fa fa-sort-amount-asc fa-fw"></i>',
				'по убыванию цены <i class="fa fa-sort-amount-desc fa-fw"></i>',
				'по наименованию <i class="fa fa-sort-alpha-asc fa-fw"></i>',
				'по наименованию <i class="fa fa-sort-alpha-desc fa-fw"></i>',
				'по популярности <i class="fa fa-sort-numeric-asc fa-fw"></i>',
				'по популярности <i class="fa fa-sort-numeric-desc fa-fw"></i>'
			];

		md_column320.className = "md_column320";
		layout.appendChild(md_column320);
		md_column320.appendChild(sort);

		$p.iface.ODropdownList({
			container: sort,
			title: "Сортировать:" + ($p.device_type == "desktop" ? "<br />" : " "),
			values: values,
			class_name: "catalog_path",
			event_name: "sort_change"
		});

		dhx4.attachEvent("sort_change", function (v) {
			$p.record_log(v);
		});

	})();

	// Область ODynDataView
	(function(){

		// пагинация
		var div_pager = document.createElement('div'),

		// контейнер dataview
			div_dataview = document.createElement('div'),

		// внешний контейнер dataview
			div_dataview_outer = document.createElement('div');

		// ODynDataView
		require('templates')();
		layout.appendChild(div_dataview_outer);
		div_dataview_outer.appendChild(div_dataview);

		div_pager.classList.add("wb-tools");
		div_dataview_outer.style.clear = "both";
		div_dataview_outer.style.height = div_dataview.style.height = _cell.offsetHeight + "px";
		div_dataview_outer.style.width = div_dataview.style.width = _cell.offsetWidth + "px";

		dataview = dhtmlXCellObject.prototype.attachDynDataView(
			{
				rest_name: "Module_ИнтеграцияСИнтернетМагазином/СписокНоменклатуры/",
				class_name: "cat.Номенклатура"
			},
			{
				container: div_dataview,
				outer_container: div_dataview_outer,
				type: "list",
				custom_css: true,
				autowidth: 1,
				pager: {
					container: div_pager,
					size:30,
					template: "{common.prev()}<div class='paging_text'> Страница {common.page()} из #limit#</div>{common.next()}"
				},
				fields: ["ref", "name"],
				selection: {}
			});
		// подключаем пагинацию
		div_dataview_outer.appendChild(div_pager);

		// подключаем контекстное меню

		// подписываемся на события dataview
		dataview.attachEvent("onAfterSelect", function (id){
			// your code here
		});

		dataview.attachEvent("onItemDblClick", function (id, ev, html){

			var hprm = $p.job_prm.parse_url(),
				dv_obj = ({})._mixin(dataview.get(id));
			dv_obj.ref = dv_obj.id;
			dv_obj.id = dv_obj.Код;
			dv_obj.name = dv_obj.Наименование;
			delete dv_obj.Код;
			delete dv_obj.Наименование;
			$p.cat.Номенклатура.create(dv_obj)
				.then(function (o) {
					$p.iface.set_hash(hprm.obj, id, hprm.frm, hprm.view);
				});

			return false;
		});

		// подписываемся на событие изменения размера во внешнем layout и изменение ориентации устройства
		dhx4.attachEvent("layout_resize", function (layout) {
			$p.record_log("");
		});


	})();


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
				a.innerHTML = '<i class="fa fa-folder-open-o"></i> ';
			else
				a.innerHTML = '<i class="fa fa-folder-open-o"></i> Поиск во всех разделах каталога';
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
						$p.iface.set_hash(this.ref, "", hprm.frm, hprm.view);
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
/* joined by builder */
/**
 * Главное окно интернет-магазина
 * Created 21.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @author    Evgeniy Malyarov
 * @module  init.js
 */

/**
 * Процедура устанавливает параметры работы программы, специфичные для текущей сборки
 * @param prm {Object} - в свойствах этого объекта определяем параметры работы программы
 * @param modifiers {Array} - сюда можно добавить обработчики, переопределяющие функциональность объектов данных
 */
$p.settings = function (prm, modifiers) {

	// для транспорта используем rest, а не сервис http
	prm.rest = true;
	prm.irest_enabled = true;

	// разделитель для localStorage
	prm.local_storage_prefix = "webshop_";

	// расположение rest-сервиса ut
	prm.rest_path = "/a/ut11/%1/odata/standard.odata/";

	// по умолчанию, обращаемся к зоне %%%
	prm.zone = 0;

	// расположение файлов данных
	prm.data_url = "data/";

	// расположение файла инициализации базы sql
	prm.create_tables = "data/create_tables.sql";

	// расположение страницы настроек
	prm.settings_url = "settings.html";

	// разрешаем сообщения от других окон
	prm.allow_post_message = "*";

	// используем геокодер
	prm.use_google_geo = true;

	// полноэкранный режим на мобильных
	prm.request_full_screen = true;

	// логин гостевого пользователя
	prm.guest_name = "АлхимовАА";

	// пароль гостевого пользователя
	prm.guest_pwd = "";

	// т.к. стили надо грузить в правильном порядке, а файлы базовых css зависят от скина - их имена на берегу не известны,
	// задаём список файлов css для отложенной загрузки
	prm.additional_css = ["templates/webshop.css", "templates/webshop_ie_only.css"];

	// скин по умолчанию
	prm.skin = "dhx_terrace";

	// разрешаем покидать страницу без лишних вопросов
	$p.eve.redirect = true;


};

/**
 * Рисуем основное окно при инициализации документа
 */
$p.iface.oninit = function() {

	function oninit(){

		var toolbar, hprm, items = [
			{id: "catalog", text: "Каталог", icon: "search_48.png"},
			{id: "compare", text: "Сравнение", icon: "compare_48.png"},
			{id: "cart", text: "Корзина", icon: "shop_cart_48.png"},
			{id: "orders", text: "Заказы", icon: "projects_48.png"},
			{id: "content", text: "Контент", icon: "content_48.png"},
			{id: "user", text: "Профиль", icon: "contacts_48.png"},
			{id: "settings", text: "Настройки", icon: "settings_48.png"},
			{id: "about", text: "О программе", icon: "about_48.png"}
		] ;

		//$p.eve.redirect = true;

		document.body.removeChild(document.querySelector("#webshop_splash"));

		// при первой возможности создаём layout
		if($p.device_type == "desktop"){

			$p.iface.main = new dhtmlXSideBar({
				parent: document.body,
				icons_path: dhtmlx.image_path + "dhxsidebar" + dhtmlx.skin_suffix(),
				width: 110,
				template: "icons_text",
				items: items,
				offsets: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				}
			});

			toolbar = $p.iface.main.attachToolbar({
				icons_size: 24,
				icons_path: dhtmlx.image_path + "dhxsidebar" + dhtmlx.skin_suffix(),
				items: [
					{type: "text", id: "title", text: "&nbsp;"},
					{type: "spacer"},
					{type: "text", id: "right", text: "[Город клиента и мантра магазина]"}
				]
			});

		}else{
			$p.iface.main = new dhtmlXSideBar({
				parent: document.body,
				icons_path: dhtmlx.image_path + "dhxsidebar" + dhtmlx.skin_suffix(),
				width: 180,
				header: true,
				template: "tiles",
				autohide: true,
				items: items,
				offsets: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				}
			});
		}


		$p.iface.main.attachEvent("onSelect", function(id){

			if($p.device_type == "desktop")
				toolbar.setItemText("title", window.dhx4.template("<span style='font-weight: bold; font-size: 14px;'>#text#</span>", {text: this.cells(id).getText().text}));

			hprm = $p.job_prm.parse_url();
			if(hprm.view != id)
				$p.iface.set_hash(hprm.obj, hprm.ref, hprm.frm, id);

			$p.iface["set_view_" + id]($p.iface.main.cells(id));

		});

		hprm = $p.job_prm.parse_url();
		if(!hprm.view || $p.iface.main.getAllItems().indexOf(hprm.view) == -1)
			$p.iface.set_hash(hprm.obj, hprm.ref, hprm.frm, "catalog");
		else
			setTimeout($p.iface.hash_route, 10);
	}

	function geo_current_position(pos){
		if($p.iface.main && $p.iface.main.getAttachedToolbar){
			var tb = $p.iface.main.getAttachedToolbar();
			if(tb){
				tb.setItemText("right", '<i class="fa fa-map-marker"></i> ' + (pos.city || pos.region).replace("г. ", ""));
				tb.objPull[tb.idPrefix+"right"].obj.style.marginRight = "8px"
			}
		}
	}

	// подписываемся на событие геолокатора
	dhx4.attachEvent("geo_current_position", function(pos){
		if($p.iface.main && $p.iface.main.getAttachedToolbar)
			geo_current_position(pos);
		else
			setTimeout(function () {
				geo_current_position(pos);
			}, 3000);
	});


	$p.eve.auto_log_in()
		.then(oninit)
		.catch(function (err) {
			console.log(err);
		})
		.then(function (err) {
			if($p.iface.sync)
				$p.iface.sync.close();
		});
};

/**
 * Обработчик маршрутизации
 * @param hprm
 * @return {boolean}
 */
$p.eve.hash_route.push(function (hprm) {

	// view отвечает за переключение закладки в SideBar
	if(hprm.view && $p.iface.main.getActiveItem() != hprm.view){
		$p.iface.main.getAllItems().forEach(function(item){
			if(item == hprm.view)
				$p.iface.main.cells(item).setActive(true);
		});
	}
	return false;
});
/* joined by builder */
/**
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_catalog
 */

$p.iface.set_view_catalog = function (cell) {

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
	function main_layout(){

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

			if(hprm.view == "catalog"){

				// при непустой ссылке, показываем карточку товара
				if($p.is_guid(hprm.ref) && !$p.is_empty_guid(hprm.ref)){
					product_card($p.iface._catalog.carousel.cells("goods"), hprm.ref)

				}
				// иначе - переключаемся на закладку списка
				else
					$p.iface._catalog.carousel.cells("dataview").setActive();
			}

		});

	}

	// создаём элементы
	if(!$p.iface._catalog)
		main_layout();


};

/* joined by builder */
/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_cart
 */

$p.iface.set_view_cart = function (cell) {

	if($p.iface._cart)
		return;

	$p.iface._cart = {};
	cell.attachHTMLString("<div>Корзина пуста</div>");

};

/* joined by builder */
/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_compare
 */

$p.iface.set_view_compare = function (cell) {

	if($p.iface._compare)
		return;

	$p.iface._compare = {
		grid: cell.attachGrid()
	};

};

/* joined by builder */
/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_orders
 */

$p.iface.set_view_orders = function (cell) {

	if($p.iface._orders)
		return;

	$p.iface._orders = {};
	cell.attachHTMLString("<div>Нет заказов</div>");

};

/* joined by builder */
/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_settings
 */

$p.iface.set_view_settings = function (cell) {

	if($p.iface._settings)
		return;

	$p.iface._settings = {};
	cell.attachHTMLString(require('settings'));
	$p.iface._settings._cell = cell.cell.querySelector(".dhx_cell_cont_sidebar");
	$p.iface._settings._cell.style.overflow = "auto";
	$p.iface._settings._form1 = $p.iface._settings._cell.querySelector("[name=form1]");
	$p.iface._settings._form2 = $p.iface._settings._cell.querySelector("[name=form2]");
	$p.iface._settings._form3 = $p.iface._settings._cell.querySelector("[name=form3]");

	$p.iface._settings.form1 = new dhtmlXForm($p.iface._settings._form1.firstChild, [

		{ type:"settings", labelWidth:80, position:"label-left"  },

		{type: "label", labelWidth:320, label: "Тип устройства", className: "label_options"},
		{ type:"block" , name:"form_block_2", list:[
			{ type:"settings", labelAlign:"left", position:"label-right"  },
			{ type:"radio" , name:"device_type", labelWidth:120, label:'<i class="fa fa-desktop"></i> Компьютер', value:"desktop"},
			{ type:"newcolumn"   },
			{ type:"radio" , name:"device_type", labelWidth:150, label:'<i class="fa fa-mobile fa-lg"></i> Телефон, планшет', value:"phone"},
		]  },
		{type:"template", label:"",value:"",
			note: {text: "Класс устройства определяется автоматически, но пользователь может задать его явно", width: 320}},

		{type: "label", labelWidth:320, label: "Вариант оформления интерфейса", className: "label_options"},
		{type:"combo" , inputWidth: 220, name:"skin", label:"Скин", options:[
			{value: "dhx_web", text: "Web"},
			{value: "dhx_terrace", text: "Terrace"}
		]},
		{type:"template", label:"",value:"",
			note: {text: "Дополнительные свойства оформления можно задать в css", width: 320}},

		{type: "label", labelWidth:320, label: "Адрес http сервиса 1С", className: "label_options"},
		{type:"input" , inputWidth: 220, name:"rest_path", label:"Путь", validate:"NotEmpty"},
		{type:"template", label:"",value:"",
			note: {text: "Можно указать как относительный, так и абсолютный URL публикации 1С OData. " +
			"О настройке кроссдоменных запросов к 1С <a href='#'>см. здесь</a>", width: 320}},

		{type: "label", labelWidth:320, label: "Значение разделителя публикации 1С fresh", className: "label_options"},
		{type:"input" , inputWidth: 220, name:"zone", label:"Зона", numberFormat: ["0", "", ""], validate:"NotEmpty,ValidInteger"},
		{type:"template", label:"",value:"",
			note: {text: "Для неразделенной публикации, зона = 0", width: 320}}

	]);

	$p.iface._settings.form2 = new dhtmlXForm($p.iface._settings._form2.firstChild, [

		{ type:"settings", labelWidth:80, position:"label-left"  },

		{type: "label", labelWidth:320, label: "Доступные закладки", className: "label_options"},
		{
			type:"container",
			name: "views",
			inputWidth: 320,
			inputHeight: 320
		},
		{type:"template", label:"",value:"",
			note: {text: "Видимость и порядок закладок навигации", width: 320}},


	]);

	$p.iface._settings.form3 = new dhtmlXForm($p.iface._settings._form3.firstChild, [

		{ type:"settings", labelWidth:80, position:"label-left"  },
		{type: "button", name: "save", value: "Применить настройки", offsetTop: 20}

	]);

	$p.iface._settings.form1.checkItem("device_type", $p.wsql.get_user_param("device_type"));


	["zone", "skin", "rest_path"].forEach(function (prm) {
		$p.iface._settings.form1.setItemValue(prm, $p.wsql.get_user_param(prm));
	});

	$p.iface._settings.form1.attachEvent("onChange", function (name, value, state){
		$p.wsql.set_user_param(name, value);
	});

	$p.iface._settings.form3.attachEvent("onButtonClick", function(name){
		location.reload();
	});




};

/* joined by builder */
/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_user
 */

$p.iface.set_view_user = function (cell) {

	if($p.iface._user)
		return;

	$p.iface._user = {};
	cell.attachHTMLString("<div>Пользователь не авторизован</div>");

};

/* joined by builder */
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

	$p.iface._content = {};
	cell.attachHTMLString("<div>Статьи пока не написаны</div>");

};

/* joined by builder */
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

}),{
"templates": (function (require, exports, module) { /* wrapped by builder */
/**
 *
 * Created 05.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author    Evgeniy Malyarov
 * @module  templates.js
 */

module.exports = function() {

	// строка стиля картинки
	function get_image_style(o){
		if(o.ФайлКартинки != $p.blank.guid){
			return "background-image:url(templates/product_pics/"+o.ФайлКартинки+".png);";
		}
		return "";
	}

	// строка представления производителя
	function get_manufacturer(o){
		if(o.Производитель != $p.blank.guid){
			return $p.cat.Производители.get(o.Производитель).presentation;
		}
		return "";
	}

	// цена
	function get_price(o){
		return (o.Цена_Мин == o.Цена_Макс ? o.Цена_Мин.toFixed(0) : 'от ' + o.Цена_Мин.toFixed(0) + ' до ' + o.Цена_Макс.toFixed(0)) +
			' <i class="fa fa-rub" style="font-size: 18px;"></i>';
	}

	// определяем представления DataView
	dhtmlx.Type.add(dhtmlXDataView,{
		name:"list",
		template:"http->templates/dataview_list.html",
		template_loading:"Загрузка данных...",
		height: 100,
		width: 900,
		margin: 2,
		padding:0,
		border: 1,
		image:get_image_style,
		manufacturer: get_manufacturer,
		price: get_price
	});

	dhtmlx.Type.add(dhtmlXDataView,{
		name:"large",
		template:"http->templates/dataview_large.html",
		height: 210,
		width: 380,
		margin: 2,
		padding:2,
		border: 1,
		image:get_image_style,
		manufacturer: get_manufacturer,
		price: get_price
	});

	dhtmlx.Type.add(dhtmlXDataView,{
		name:"small",
		template:"http->templates/dataview_small.html",
		height: 180,
		width: 220,
		margin: 2,
		padding:2,
		border: 1,
		image:get_image_style,
		manufacturer: get_manufacturer,
		price: get_price
	});
};

}),
"about": "<div class=\"md_column1300\">\r\n    <h1><i class=\"fa fa-info-circle\"></i> Интернет-магазин MetaStore v0.0.3</h1>\r\n    <p>Метамагазин - это веб-приложение с открытым исходным кодом, разработанное компанией <a href=\"http://www.oknosoft.ru/\" target=\"_blank\">Окнософт</a> на базе фреймворка <a href=\"http://www.oknosoft.ru/metadata/\" target=\"_blank\">Metadata.js</a> и распространяемое под <a href=\"http://www.oknosoft.ru/programmi-oknosoft/metadata.html\" target=\"_blank\">коммерческой лицензией Окнософт</a>.<br />\r\n        Исходный код и документация доступны на <a href=\"https://github.com/oknosoft/metastore\" target=\"_blank\">GitHub <i class=\"fa fa-github-alt\"></i></a>.<br />\r\n        Приложение является веб-интерфейсом к типовым конфигурациям 1С (Управление торговлей 11.2, Комплексная автоматизация 2.0, ERP Управление предприятием 2.1) и реализует функциональность интернет-магазина для информационной базы 1С\r\n    </p>\r\n    <p>Использованы следующие библиотеки и инструменты:</p>\r\n\r\n    <h3>Серверная часть</h3>\r\n    <ul>\r\n        <li><a href=\"http://1c-dn.com/1c_enterprise/\" target=\"_blank\">1c_enterprise</a><span class=\"md_muted_color\">, ORM сервер 1С:Предприятие</span></li>\r\n        <li><a href=\"http://www.postgresql.org/\" target=\"_blank\">postgreSQL</a><span class=\"md_muted_color\">, мощная объектно-раляционная база данных</span></li>\r\n        <li><a href=\"https://nodejs.org/\" target=\"_blank\">node.js</a><span class=\"md_muted_color\">, серверная программная платформа, основанная на движке V8 javascript</span></li>\r\n        <li><a href=\"http://nginx.org/ru/\" target=\"_blank\">nginx</a><span class=\"md_muted_color\">, высокопроизводительный HTTP-сервер</span></li>\r\n    </ul>\r\n\r\n    <h3>Управление данными в памяти браузера</h3>\r\n    <ul>\r\n        <li><a href=\"https://github.com/agershun/alasql\" target=\"_blank\">alaSQL</a><span class=\"md_muted_color\">, база данных SQL для браузера и Node.js с поддержкой как традиционных реляционных таблиц, так и вложенных JSON данных (NoSQL)</span></li>\r\n        <li><a href=\"https://github.com/metatribal/xmlToJSON\" target=\"_blank\">xmlToJSON</a><span class=\"md_muted_color\">, компактный javascript модуль для преобразования XML в JSON</span></li>\r\n        <li><a href=\"https://github.com/SheetJS/js-xlsx\" target=\"_blank\">xlsx</a><span class=\"md_muted_color\">, библиотека для чтения и записи XLSX / XLSM / XLSB / XLS / ODS в браузере</span></li>\r\n    </ul>\r\n\r\n    <h3>UI библиотеки и компоненты интерфейса</h3>\r\n    <ul>\r\n        <li><a href=\"http://dhtmlx.com/\" target=\"_blank\">dhtmlx</a><span class=\"md_muted_color\">, кроссбраузерная библиотека javascript для построения современных веб и мобильных приложений</span></li>\r\n        <li><a href=\"https://github.com/leongersen/noUiSlider\" target=\"_blank\">noUiSlider</a><span class=\"md_muted_color\">, легковесный javascript компонент регулирования пары (min-max) значений </span></li>\r\n        <li><a href=\"https://github.com/eligrey/FileSaver.js\" target=\"_blank\">filesaver.js</a><span class=\"md_muted_color\">, HTML5 реализация метода saveAs</span></li>\r\n    </ul>\r\n\r\n    <h3>Графика</h3>\r\n    <ul>\r\n        <li><a href=\"https://fortawesome.github.io/Font-Awesome/\" target=\"_blank\">fontawesome</a><span class=\"md_muted_color\">, набор иконок и стилей CSS</span></li>\r\n    </ul>\r\n\r\n    <p>&nbsp;</p>\r\n    <h2><i class=\"fa fa-question-circle\"></i> Вопросы</h2>\r\n    <p>Если обнаружили ошибку, пожалуйста,\r\n        <a href=\"https://github.com/oknosoft/metastore/issues/new\" target=\"_blank\">зарегистрируйте вопрос в GitHub</a> или\r\n        <a href=\"http://www.oknosoft.ru/metadata/#page-118\" target=\"_blank\">свяжитесь с разработчиком</a> напрямую<br />&nbsp;</p>\r\n\r\n</div>",
"settings": "<div class=\"md_column1300\">\r\n    <h1><i class=\"fa fa-cogs\"></i> Настройки</h1>\r\n    <p>В промышленном режиме, данная страница выключена.<br />\r\n        Внешний вид сайта и параметры подключения к базе данных настраиваются в конфигурационном файле.<br />\r\n        В демо-ражиме страница настроек иллюстрирует использование параметров работы программы клиентской частью приложения.</p>\r\n\r\n    <div class=\"md_column320\" name=\"form1\" style=\"max-width: 420px;\"><div></div></div>\r\n    <div class=\"md_column320\" name=\"form2\"><div></div></div>\r\n    <div class=\"md_column320\" name=\"form3\"><div></div></div>\r\n</div>"
},{},{});
