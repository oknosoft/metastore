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

	// логин гостевого пользователя
	prm.guest_name = "АлхимовАА";

	// пароль гостевого пользователя
	prm.guest_pwd = "";

	// разрешаем покидать страницу без лишних вопросов
	$p.eve.redirect = true;

};

/**
 * Рисуем основное окно при инициализации документа
 */
$p.iface.oninit = function() {

	function onstep(step){

		var stepper = $p.eve.stepper;

		switch(step) {

			case $p.eve.steps.authorization:

				stepper.frm_sync.setItemValue("text_processed", "Авторизация");

				break;

			case $p.eve.steps.load_meta:

				// малое всплывающее сообщение
				$p.msg.show_msg($p.msg.init_catalogues + $p.msg.init_catalogues_meta, $p.iface.docs);

				if(!$p.iface.sync)
					$p.iface.wnd_sync();
				$p.iface.sync.create(stepper);

				break;

			case $p.eve.steps.create_managers:

				stepper.frm_sync.setItemValue("text_processed", "Обработка метаданных");
				stepper.frm_sync.setItemValue("text_bottom", "Создаём объекты менеджеров данных...");

				break;

			case $p.eve.steps.process_access:

				break;

			case $p.eve.steps.load_data_files:

				stepper.frm_sync.setItemValue("text_processed", "Загрузка начального образа");
				stepper.frm_sync.setItemValue("text_bottom", "Читаем файлы данных зоны...");

				break;

			case $p.eve.steps.load_data_db:

				stepper.frm_sync.setItemValue("text_processed", "Загрузка изменений из 1С");
				stepper.frm_sync.setItemValue("text_bottom", "Читаем изменённые справочники");

				break;

			case $p.eve.steps.load_data_wsql:

				break;

			case $p.eve.steps.save_data_wsql:

				stepper.frm_sync.setItemValue("text_processed", "Кеширование данных");
				stepper.frm_sync.setItemValue("text_bottom", "Сохраняем таблицы в локальном SQL...");

				break;

			default:

				break;
		}

	};

	function oninit(){
		var toolbar, items = [
			{id: "catalog", text: "Каталог", icon: "search_48.png"},
			{id: "compare", text: "Сравнение", icon: "compare_48.png"},
			{id: "cart", text: "Корзина", icon: "shop_cart_48.png"},
			{id: "orders", text: "Заказы", icon: "projects_48.png"},
			{id: "user", text: "Профиль", icon: "contacts_48.png"},
			{id: "settings", text: "Настройки", icon: "settings_48.png"}
		] ;

		$p.eve.redirect = true;

		// при первой возможности создаём layout
		if($p.device_type == "desktop"){

			$p.iface.main = new dhtmlXSideBar({
				parent: document.body,
				icons_path: dhtmlx.image_path + "dhxsidebar_web/",
				width: 150,
				template: "tiles",
				items: items,
				offsets: {
					top: 4,
					right: 4,
					bottom: 4,
					left: 4
				}
			});

			toolbar = $p.iface.main.attachToolbar({
				icons_size: 24,
				icons_path: dhtmlx.image_path + "dhxsidebar_web/",
				items: [
					{type: "text", id: "title", text: "&nbsp;"},
					{type: "spacer"},
					{type: "button", id: "add", img: "add_48.png"},
					{type: "button", id: "save", img: "save_48.png"}
				]
			});

		}else{
			$p.iface.main = new dhtmlXSideBar({
				parent: document.body,
				icons_path: dhtmlx.image_path + "dhxsidebar_web/",
				width: 140,
				header: true,
				template: "tiles",
				autohide: true,
				items: items
			});
		}


		$p.iface.main.attachEvent("onSelect", function(id){

			if($p.device_type == "desktop")
				toolbar.setItemText("title", window.dhx4.template("<span style='font-weight: bold; font-size: 14px;'>#text#</span>", {text: this.cells(id).getText().text}));

			var hprm = $p.job_prm.parse_url();
			if(hprm.view != id)
				$p.iface.set_hash(hprm.obj, hprm.ref, hprm.frm, id);

			$p.iface["set_view_" + id]($p.iface.main.cells(id));

		});

		$p.iface.main.cells("catalog").setActive(true);
	}

	$p.eve.log_in(onstep)
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