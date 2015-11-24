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

	// расположение socket-сервера
	//prm.ws_url = "ws://localhost:8001";

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

		// гасим заставку
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

		// подписываемся на событие навигации по сайдбару
		$p.iface.main.attachEvent("onSelect", function(id){

			if($p.device_type == "desktop")
				toolbar.setItemText("title", window.dhx4.template("<span style='font-weight: bold; font-size: 14px;'>#text#</span>", {text: this.cells(id).getText().text}));

			hprm = $p.job_prm.parse_url();
			if(hprm.view != id)
				$p.iface.set_hash(hprm.obj, hprm.ref, hprm.frm, id);

			$p.iface["view_" + id]($p.iface.main.cells(id));

		});

		// шаблоны ODynDataView инициализируем сразу
		require('templates')();

		// еще, сразу инициализируем класс OViewCompare, т.к. в нём живут обработчики добавления в корзину и история просмотров
		// и класс OViewCart, чтобы обрабатывать события добавления в корзину
		setTimeout(function () {
			$p.iface.view_compare($p.iface.main.cells("compare"));
			$p.iface.view_cart($p.iface.main.cells("cart"));
		}, 50);

		hprm = $p.job_prm.parse_url();
		if(!hprm.view || $p.iface.main.getAllItems().indexOf(hprm.view) == -1){
			var last_hprm = $p.wsql.get_user_param("last_hash_url", "object");
			if(last_hprm)
				$p.iface.set_hash(last_hprm.obj, last_hprm.ref, last_hprm.frm, last_hprm.view || "catalog");
			else
				$p.iface.set_hash(hprm.obj, hprm.ref, hprm.frm, $p.device_type == "desktop" ? "content" : "catalog");
		} else
			setTimeout($p.iface.hash_route, 10);
	}

	// подписываемся на событие геолокатора
	// если геолокатор ответит раньше, чем сформируется наш интерфейс - вызовем событие повторно через 3 сек
	function geo_current_position(pos){
		if($p.iface.main && $p.iface.main.getAttachedToolbar){
			var tb = $p.iface.main.getAttachedToolbar();
			if(tb){
				tb.setItemText("right", '<i class="fa fa-map-marker"></i> ' + (pos.city || pos.region).replace("г. ", ""));
				tb.objPull[tb.idPrefix+"right"].obj.style.marginRight = "8px"
			}
		}
	}
	dhx4.attachEvent("geo_current_position", function(pos){
		if($p.iface.main && $p.iface.main.getAttachedToolbar)
			geo_current_position(pos);
		else
			setTimeout(function () {
				geo_current_position(pos);
			}, 3000);
	});

	// подписываемся на событие при закрытии страницы - запоминаем последний hash_url
	window.addEventListener("beforeunload", function () {
		$p.wsql.set_user_param("last_hash_url", $p.job_prm.parse_url())
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