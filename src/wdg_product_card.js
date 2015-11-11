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