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
 * @param [attr.ref] {String|DataObj} - ссылка или номенклатура
 * @constructor
 */
dhtmlXCellObject.prototype.attachOProductCard = function(attr) {

	if(!attr)
		attr = {};

	this.attachHTMLString(require('product_card'));

	baron({
		root: '.wdg_product_accordion',
		scroller: '.scroller',
		bar: '.scroller__bar',
		barOnCls: 'baron',

		$: $,   // Local copy of jQuery-like utility

		event: function(elem, event, func, mode) { // Events manager
			if (mode == 'trigger') {
				mode = 'fire';
			}
			bean[mode || 'on'](elem, event, func);
		}
	}).fix({
		elements: '.header__title',
		outside: 'header__title_state_fixed',
		before: 'header__title_position_top',
		after: 'header__title_position_bottom',
		clickable: true
	}).pull({
		block: '.load',
		elements: [{
			self: '.load__value',
			property: 'width'
		}],
		limit: 115,
		onExpand: function() {
			$('.load').css('background', 'grey');
		}
	});


	var _cell = this.cell,
		res = {
			container: _cell.querySelector(".wdg_product_accordion"),
			header: _cell.querySelector("[name=header]"),
			title: _cell.querySelector("[name=title]"),
			path: _cell.querySelector("[name=path]"),
			main: new CardMain(_cell.querySelector("[name=main]")),
			description: _cell.querySelector("[name=description]"),
			notes: _cell.querySelector("[name=notes]"),
			download: _cell.querySelector("[name=download]")
		},

		// кнопка "вернуться к списку"
		back = new $p.iface.OTooolBar({
			wrapper: res.header,
			width: '28px',
			height: '29px',
			top: '0px',
			right: '20px',
			name: 'back',
			image_path: dhtmlx.image_path + "dhxsidebar" + dhtmlx.skin_suffix(),
			class_name: "",
			buttons: [
				{name: 'back', text: '<i class="fa fa-long-arrow-left fa-lg" style="vertical-align: 15%;"></i>', title: 'Вернуться к списку', float: 'right'}
			],
			onclick: function (name) {
				switch (name) {
					case "back":
						var hprm = $p.job_prm.parse_url();
						$p.iface.set_hash(hprm.obj, "", hprm.frm, hprm.view);
						if($p.iface.popup)
							$p.iface.popup.hide();
						break;
				}
			}
		}),
		path = new $p.iface.CatalogPath(res.path, function (e) {
			var hprm = $p.job_prm.parse_url();
			$p.iface.set_hash(this.ref, "", hprm.frm, hprm.view);
			return $p.cancel_bubble(e)
		});

	//if($p.device_type != "desktop")
	//	res.download.style.visibility = "hidden";

	/**
	 * Перезаполняет все ячейки аккордеона
	 * @param ref
	 */
	function requery(ref){

		// информацию про номенклатуру, полученную ранее используем сразу
		var nom = $p.cat.Номенклатура.get(ref, false);
		res.main.requery_short(nom);

		// дополнительное описание получаем с сервера и перезаполняем аккордеон
		if(nom.is_new()){

			nom.load()
				.then(res.main.requery_long)
				.catch($p.record_log);
		}else
			res.main.requery_long(nom);

	}

	/**
	 * Изображение, цена и кнопки купить - сравнить - добавить
	 * @param cell {HTMLElement}
	 * @constructor
	 */
	function CardMain(cell){

		var _img = cell.querySelector(".product_img"),
			_title = cell.querySelector("[name=order_title]"),
			_price = cell.querySelector("[name=order_price]"),
			_brand = cell.querySelector("[name=order_brand]"),
			_carousel = new dhtmlXCarousel({
				parent:         cell.querySelector(".product_carousel"),
				offset_left:    0,      // number, offset between cell and left/right edges
				offset_top:     0,      // number, offset between cell and top/bottom edges
				offset_item:    0,      // number, offset between two nearest cells
				touch_scroll:   true    // boolean, true to enable scrolling cells with touch
		});

		function set_title(nom){
			_title.innerHTML = res.title.innerHTML = nom.НаименованиеПолное || nom.name;
		}

		// короткое обновление свойств без обращения к серверу
		this.requery_short = function (nom) {
			set_title(nom);
			_price.innerHTML = dhtmlXDataView.prototype.types.list.price(nom);
			_img.src = "templates/product_pics/" + nom.ФайлКартинки.ref + ".png";
			if(!nom.Файлы){
				_carousel.base.style.display = "none";
				_img.style.display = "";
			}
		};

		// длинное обновление свойств после ответа сервера
		this.requery_long = function (nom) {
			var files = JSON.parse(nom.Файлы);

			if(files.length){
				// удаляем страницы карусели
				var ids = [];
				_carousel.forEachCell(function(item){
					ids.push(item.getId());
				});
				ids.forEach(function (id) {
					_carousel.cells(id).remove();
				});

				// рисуем новые страницы
				_img.style.display = "none";
				_carousel.base.style.display = "";
				files.forEach(function (file) {
					ids = _carousel.addCell();
					_carousel.cells(ids).attachHTMLString('<img class="aligncenter" style="height: 100%" src="templates/product_pics/'+file.ref+'.'+file.ext+'" >');
				});

			}else{
				// одиночное изображение
				_carousel.base.style.display = "none";
				_img.style.display = "";
			}

			// обновляем наименование - оно могло измениться
			set_title(nom);

			//
			if(nom.Марка != $p.blank.guid)
				_brand.innerHTML = "Марка (бренд): " + nom.Марка.presentation;

			else if(nom.Производитель != $p.blank.guid){
				_brand.innerHTML = "Производитель: " + nom.Производитель.presentation;

			}

		};

		// подписываемся на событие изменения размера
		dhx4.attachEvent("layout_resize", function (layout) {

		});

	}


	// обработчик маршрутизации
	$p.eve.hash_route.push(function (hprm){
		if(hprm.view == "catalog" && $p.is_guid(hprm.ref) && !$p.is_empty_guid(hprm.ref))
			requery(hprm.ref);
	});

	if(attr.ref){
		requery(attr.ref);
		delete attr.ref;
	}

	return res;

};