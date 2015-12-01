/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_compare
 */

/**
 * Показывает список просмотренных товаров + табы по видам номенклатуры с трансформом свойств
 * @param cell {dhtmlXCellObject}
 */
$p.iface.view_compare = function (cell) {

	function OViewCompare(){

		var t = this,
			_cell = cell,
			_dataview,
			prefix = "view_compare_",
			changed;

		/**
		 * Добавляет номенклатуру в список просмотренных и дополнительно, в список к сравнению
		 * @param ref {String} - ссылка номенклатуры
		 * @param to_compare {Boolean} - добавлять не только в просмотренные, но и к сравнению
		 * @return {Boolean}
		 */
		t.add = function (ref, to_compare) {

			if($p.is_empty_guid(ref))
				return;

			var list = t.list("viewed"),
				do_requery = false;

			function push(to_compare){
				if(list.indexOf(ref) == -1){
					list.push(ref);
					$p.wsql.set_user_param(prefix + (to_compare ? "compare" : "viewed"), list);
					do_requery = true;
				}
			}

			push();

			if(to_compare){
				list = t.list("compare");
				push(to_compare);

				var nom = $p.cat.Номенклатура.get(ref, false, true);
				if(nom){
					t.bubble();
					$p.msg.show_msg((nom.НаименованиеПолное || nom.name) + " добавлен к сравнению");
				}
			}

			if(do_requery)
				changed = true;

			return do_requery;

		};

		/**
		 * Удаляет номенклатуру из списка к сравнению и дополнительно, из списка просмотренных
		 * @param ref {String} - ссылка номенклатуры
		 * @param from_viewed {Boolean} - добавлять не только в просмотренные, но и к сравнению
		 */
		t.remove = function (ref, from_viewed) {
			var list = t.list("compare"),
				index = list.indexOf(ref);
			if(index != -1){
				list.splice(index, 1);
				$p.wsql.set_user_param(prefix + "compare", list);
			}
			if(from_viewed){
				list = t.list("viewed");
				index = list.indexOf(ref);
				if(index != -1){
					list.splice(index, 1);
					$p.wsql.set_user_param(prefix + "viewed", list);
				}
			}
			t.requery();
		};

		/**
		 * Возвращает список просмотренных либо список к сравнению
		 * @param type
		 * @return {*}
		 */
		t.list = function (type) {
			var list = $p.wsql.get_user_param(prefix + type, "object");
			if(!Array.isArray(list)){
				list = [];
				$p.wsql.set_user_param(prefix + type, list);
			}
			return list;
		};

		t.tabs = _cell.attachTabbar({
			arrows_mode:    "auto",
			tabs: [
				{id: "viewed", text: '<i class="fa fa-eye"></i> Просмотренные', active: true}
			]
		});

		t.bubble = function () {
			if(t.list("compare").length)
				_cell.setBubble(t.list("compare").length);
			else
				_cell.clearBubble();
		};

		t.requery = function () {


			var ids = t.tabs.getAllTabs(),
				mgr = $p.cat.Номенклатура,
				nom,

				// получаем полный список номенклатур
				list = t.list("compare").concat(t.list("viewed")).filter(function(item, pos, self) {
					return self.indexOf(item) == pos;
				});

			// удаляем допзакладки
			t.tabs.tabs("viewed").setActive();
			for (var i=0; i<ids.length; i++) {
				if(ids[i] != "viewed")
					t.tabs.tabs(ids[i]).close();
			}

			// убеждаемся, что все номенклатуры по использованным к сравнению ссылкам, есть в памяти
			// и получаем массив видов номенклатуры к сравнению
			ids = [];
			mgr.load_cached_server_array(list)
				.then(function () {
					t.list("compare").forEach(function (ref) {
						nom = mgr.get(ref, false);
						if(ids.indexOf(nom.ВидНоменклатуры) == -1)
							ids.push(nom.ВидНоменклатуры);
					});

					_dataview.requery_list(t.list("viewed"));
				})
				.then(function () {

					// добавляем закладки по видам н6оменклатуры
					ids.forEach(function (o) {
						t.tabs.addTab(o.ref, o.name);
						compare_group(t.tabs.cells(o.ref), o);
					});

				});

			t.bubble();

		};

		// подписываемся на событие добавления к сравнению
		dhx4.attachEvent("order_compare", function (nom) {
			if(typeof nom == "object")
				nom = nom.ref;
			if(!$p.is_empty_guid(nom)){
				if(t.add(nom, true))
					t.requery();
			}
		});

		function viewed_click(e){

			var target = e.target,
				elm = _dataview.get_elm(e.target);

			if(elm){

				if(target.classList.contains("dv_icon_cart"))
					dhx4.callEvent("order_cart", [elm.id]);

				else if(target.classList.contains("dv_icon_add_compare")){
					if(t.add(elm.id, true))
						t.requery();

				}else if(target.classList.contains("dv_icon_remove_viewed"))
					t.remove(elm.id, true);
			}
		}

		// строит таблицу сравнения и выводит её в ячейку
		function compare_group(tab_cell, ВидНоменклатуры){

			var nom, list = [], finded,
				_row_fields=" ,Цена,НаименованиеПолное,Артикул,Производитель".split(","),
				_rows = [],
				_row,
				_headers = " ",
				_types = "ro",
				_sortings = "na",
				_ids = "fld",
				_widths = $p.device_type == "desktop" ? "200" : "150",
				_minwidths = "100",
				_grid = tab_cell.attachGrid(),
				_price = dhtmlXDataView.prototype.types.list.price;
			_grid.setDateFormat("%d.%m.%Y %H:%fld");

			function presentation(v){

				if($p.is_data_obj(v))
					return  v.presentation;

				else if(typeof v == "boolean")
					return  v ? "Да" : "Нет";

				else if(v instanceof Date){
						if(v.getHours() || v.getMinutes())
							return $p.dateFormat(v, $p.dateFormat.masks.date_time);
						else
							return $p.dateFormat(v, $p.dateFormat.masks.date)
				}else
					return v || "";
			}

			t.list("compare").forEach(function (ref) {
				nom = $p.cat.Номенклатура.get(ref);
				if(nom.ВидНоменклатуры == ВидНоменклатуры){
					list.push(nom);
					_headers += "," + nom.name;
					_types += ",ro";
					_sortings += ",na";
					_ids += "," + nom.ref;
					_widths += ",*";
					_minwidths += ",100";
				}
			});

			// собственно табличная часть
			_grid.setIconsPath(dhtmlx.image_path);
			_grid.setImagePath(dhtmlx.image_path);
			_grid.setHeader(_headers);
			_grid.setInitWidths(_widths);
			_grid.setColumnMinWidth(_minwidths);
			_grid.setColSorting(_sortings);
			_grid.setColTypes(_types);
			_grid.setColumnIds(_ids);
			_grid.enableAutoWidth(true, 1300, 600);
			_grid.init();

			// формируем массив значений
			for(var fld in _row_fields){
				_row = [];
				if(fld == 0)
					_row.push("");
				else if(_row_fields[fld] == "НаименованиеПолное")
					_row.push("Наименование");
				else
					_row.push(_row_fields[fld]);

				for(var j in list){
					nom = list[j];
					if(fld == 0){
						_row.push("<img class='compare_img' src='templates/product_pics/" + nom.ФайлКартинки.ref + ".png' >");
					}else if(fld == 1){
						_row.push("<span style='font-size: large'>" + _price(nom) + "</span>");
					}else{
						_row.push(presentation(nom[_row_fields[fld]]));
					}
				}
				_rows.push(_row);
			}
			ВидНоменклатуры.НаборСвойств.extra_fields.find_rows({deleted: false}, function (o) {
				_row = [o.property.Заголовок || o.property.presentation];
				for(var j in list){
					nom = list[j];
					finded = false;
					nom.extra_fields.find_rows({property: o.property}, function (row) {
						_row.push(presentation(row.value));
						finded = true;
						return false;
					});
					if(!finded){
						if(o.property.type.types.length && o.property.type.types[0] == "boolean")
							_row.push(presentation(false));
						else
							_row.push("");
					}
				}
				_rows.push(_row);
			});
			_grid.parse(_rows,"jsarray");

		}

		// Обработчик маршрутизации
		function hash_route(hprm){

			// обновляем список при переключении
			if(hprm.view == "compare"){

				if(changed || changed === undefined){
					t.requery();
					changed = false;
				}

				// при открытии карточки в каталоге, добавляем в список просмотренных
			}else{

				if(hprm.view == "catalog" && !$p.is_empty_guid(hprm.ref)){
					if($p.cat.ВидыНоменклатуры.get(hprm.obj, false, true) && !$p.cat.ВидыНоменклатуры.get(hprm.obj, false, true).empty())
						t.add(hprm.ref);
				}

				t.bubble();
			}
		}

		// подписываемся на маршрутизацию
		$p.eve.hash_route.push(hash_route);

		setTimeout(function () {

			// dataview со списком просмотренных товаров
			_dataview = $p.iface.list_data_view({
				container: t.tabs.cells("viewed"),
				custom_css: ["viewed"],
				type: "viewed",
				autosize: true
			});

			t.tabs.cells("viewed").cell.addEventListener('click', viewed_click, false);

			hash_route($p.job_prm.parse_url());

		}, 50);

	}

	if(!$p.iface._compare)
		$p.iface._compare = new OViewCompare();

	return $p.iface._compare;

};
