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


	function dyn_data_view(cell){

		// пагинация
		var div_pager = document.createElement('div'),

		// контейнер dataview
			div_dataview = document.createElement('div'),

		// внешний контейнер dataview
			div_dataview_outer = document.createElement('div'),

		// внешний для внешнего контейнер dataview
			container = document.createElement('div'),

		// указатель на dataview и параметры dataview
			dataview, dataview_attr;

		cell.attachObject(container);
		container.style.width = "100%";
		container.style.height = "100%";

		// ODynDataView
		container.appendChild(div_dataview_outer);
		div_dataview_outer.appendChild(div_dataview);

		div_pager.classList.add("wb-tools");
		div_dataview_outer.style.clear = "both";
		div_dataview_outer.style.height = div_dataview.style.height = container.offsetHeight + "px";
		div_dataview_outer.style.width = div_dataview.style.width = container.offsetWidth + "px";

		dataview_attr = {
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
			fields: ["ref", "name"]
		};

		dataview = dhtmlXCellObject.prototype.attachDynDataView(
			{
				rest_name: "Module_ИнтеграцияСИнтернетМагазином/СписокНоменклатуры/",
				class_name: "cat.Номенклатура"
			}, dataview_attr);

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
			dv_obj._not_set_loaded = true;
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

		return dataview;

	};

	function ViewCompare(){

		var t = this,
			prefix = "view_compare_",
			dataview_viewed,
			changed;

		if(!cell)
			cell = $p.iface.main.cells("compare");

		/**
		 * Добавляет номенклатуру в список просмотренных и дополнительно, в список к сравнению
		 * @param ref {String} - ссылка номенклатуры
		 * @param to_compare {Boolean} - добавлять не только в просмотренные, но и к сравнению
		 * @return {Boolean}
		 */
		t.add = function (ref, to_compare) {

			if($p.is_empty_guid(ref))
				return;

			var list = this.list("viewed"),
				do_requery = false;

			function push(){
				if(list.indexOf(ref) == -1){
					list.push(ref);
					$p.wsql.set_user_param(prefix + "viewed", list);
					do_requery = true;
				}
			}

			push();

			if(to_compare){
				list = this.list("compare");
				push();
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
				{id: "viewed", text: '<i class="fa fa-eye"></i> Просмотренные', active: true},
				{id: "filter", text: '<i class="fa fa-filter"></i> Фильтр'}
			]
		});

		t.requery = function () {
			dataview_viewed.selection = {ref: {in: t.list("viewed")}};
		};

		dataview_viewed = dyn_data_view(this.tabs.cells("viewed"));


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
			hash_route($p.job_prm.parse_url());
		}, 50);

	}

	if(!$p.iface._compare)
		$p.iface._compare = new ViewCompare();

	return $p.iface._compare;

};
