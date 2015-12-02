/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_user
 */

$p.iface.view_user = function (cell) {

	function OViewUser(){

		var t = this,
			attr = {url: ""};

		function fill_tabs(){
			var user = $p.cat.ВнешниеПользователи.find(),
				def_prm = {
					hide_header: true,
					hide_filter: true
				};

			t.tabs.cells("main").attachHeadFields({obj: user});
			t.tabs.cells("main").attachToolbar({
				icons_size: 24,
				icons_path: dhtmlx.image_path + "dhxsidebar" + dhtmlx.skin_suffix(),
				items: [
					{type: "text", id: "title", text: "<span style='font-size: large'>Реквизиты автризации</span>"}
				]
			});

			t.tabs.cells("contacts").attachTabular({
				obj: user.ОбъектАвторизации,
				ts: "КонтактнаяИнформация",
				read_only: true
			});

			$p.cat.Контрагенты.form_selection(t.tabs.cells("contractors"), def_prm);

			$p.cat.КартыЛояльности.form_selection(t.tabs.cells("discounts"), def_prm);

			$p.cat.КонтактныеЛицаПартнеров.form_selection(t.tabs.cells("persons"), def_prm);

		}

		t.tabs = cell.attachTabbar({
			arrows_mode:    "auto",
			tabs: [
				{id: "main", text: '<i class="fa fa-user"></i> Основное', active: true},
				{id: "contacts", text: '<i class="fa fa-paper-plane-o"></i> Адрес, телефон'},
				{id: "contractors", text: '<i class="fa fa-university"></i> Контрагенты'},
				{id: "discounts", text: '<i class="fa fa-credit-card-alt"></i> Карты лояльности'},
				{id: "persons", text: '<i class="fa fa-reddit-alien"></i> Контактные лица'}
			]
		});

		// получаем список доступных текущему пользователю партнеров, договоров и контрагентов
		if($p.cat.ВнешниеПользователи.find()){
			fill_tabs();
		}else{
			$p.rest.build_select(attr, {
				rest_name: "Module_ИнтеграцияСИнтернетМагазином/СправочникиПользователя/",
				class_name: "cat.Пользователи"
			});
			$p.ajax.get_ex(attr.url, attr)
				.then(function (req) {
					$p.eve.from_json_to_data_obj(req);
				})
				.then(fill_tabs)
				.catch(function (err) {
					$p.record_log(err);
				});
		}

		// Обработчик маршрутизации
		function hash_route(hprm){

			// открываем форму выбранного объекта
			if(hprm.view == "user"){

				var mgr = $p.md.mgr_by_class_name(hprm.obj);
				if(mgr && !$p.is_empty_guid(hprm.ref))
					mgr.form_obj(t.tabs.cells(t.tabs.getActiveTab()), hprm.ref);
			}
		}
		// подписываемся на маршрутизацию
		$p.eve.hash_route.push(hash_route);

	}

	if(!$p.iface._user)
		$p.iface._user = new OViewUser();

	return $p.iface._user;

};
