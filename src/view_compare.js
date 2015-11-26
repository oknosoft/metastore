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
			prefix = "view_compare_",
			dataview_viewed,
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

		t.tabs = cell.attachTabbar({
			arrows_mode:    "auto",
			tabs: [
				{id: "viewed", text: '<i class="fa fa-eye"></i> Просмотренные', active: true}
			]
		});

		t.requery = function () {


			var ids = t.tabs.getAllTabs(),
				mgr = $p.cat.Номенклатура,
				nom,

				// получаем полный список номенклатур
				list = t.list("compare").concat(t.list("viewed")).filter(function(item, pos, self) {
					return self.indexOf(item) == pos;
				});

			// удаляем допзакладки
			for (var q=0; q<ids.length; q++) {
				if(ids[q] != "viewed")
					t.tabs.tabs(ids[q]).close();
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

					dataview_viewed.requery_list(t.list("viewed"));
				});

		};

		// подписываемся на событие добавления к сравнению
		dhx4.attachEvent("order_compare", function (nom) {
			if(nom && !$p.is_empty_guid(nom.ref))
				t.add(nom.ref, true);
		});


		// Обработчик маршрутизации
		function hash_route(hprm){

			// обновляем список при переключении
			if(hprm.view == "compare"){

				if(changed || changed === undefined){
					t.requery();
					changed = false;
				}

				// при открытии карточки в каталоге, добавляем в список просмотренных
			}else if(hprm.view == "catalog" && !$p.is_empty_guid(hprm.ref)){

				t.add(hprm.ref);

			}
		}

		// подписываемся на маршрутизацию
		$p.eve.hash_route.push(hash_route);

		setTimeout(function () {

			// dataview со списком просмотренных товаров
			dataview_viewed = $p.iface.list_data_view({
				container: t.tabs.cells("viewed"),
				custom_css: ["viewed"],
				type: "viewed"
			});

			hash_route($p.job_prm.parse_url());

		}, 50);

	}

	if(!$p.iface._compare)
		$p.iface._compare = new OViewCompare();

	return $p.iface._compare;

};
