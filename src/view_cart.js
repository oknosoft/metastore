/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_cart
 */

$p.iface.view_cart = function (cell) {

	var _requered;

	function OViewCart(){

		// карусель с dataview корзины и страницей оформления заказа
		var t = this,
			_cell = cell,
			prefix = "view_cart",
			_carousel = _cell.attachCarousel({
				keys:           false,
				touch_scroll:   false,
				offset_left:    0,
				offset_top:     0,
				offset_item:    0
			}),
			_container_cart,
			_content,
			_dataview,
			_cart,
			_do_order;

		/**
		 * Возвращает список товаров в корзине
		 * @return {Array}
		 */
		t.list = function () {
			var list = $p.wsql.get_user_param(prefix, "object");
			if(!Array.isArray(list)){
				list = [];
				$p.wsql.set_user_param(prefix, list);
			}
			return list;
		};

		t.bubble = function () {
			var bubble = 0;
			t.list().forEach(function (o) {
				bubble += o.count;
			});
			if(bubble)
				_cell.setBubble(bubble);
			else
				_cell.clearBubble();
		};

		/**
		 * Добавляет номенклатуру в корзину. Если уже есть, увеличивает количество
		 * @param nom {CatObj|String} - объект номенклатуры или ссылка
		 */
		t.add = function (nom) {

			if(typeof nom == "string"){
				if($p.is_empty_guid(nom))
					return;
				nom = $p.cat.Номенклатура.get(nom, false, true);
			}
			if(!nom || !nom.name)
				return;

			var list = t.list(),
				finded;

			for(var i in list){
				if(list[i].ref == nom.ref){
					list[i].count++;
					finded = true;
					break;
				}
			}
			if(!finded){
				list.push({ref: nom.ref, count: 1});
			}
			$p.wsql.set_user_param(prefix, list);

			$p.msg.show_msg((nom.НаименованиеПолное || nom.name) + " добавлен в корзину");

			t.requery();

		};

		/**
		 * Удаляет номенклатуру из корзины
		 * @param ref {String} - ссылка номенклатуры
		 */
		t.remove = function (ref) {
			var list = t.list();

			for(var i in list){
				if(list[i].ref == ref || list[i].id == ref){

					dhtmlx.confirm({
						type:"confirm",
						title:"Корзина",
						text:"Подтвердите удаление товара",
						ok: "Удалить",
						cancel: "Отмена",
						callback: function(result){
							if(result){
								list.splice(i, 1);
								$p.wsql.set_user_param(prefix, list);
								t.requery();
							}
						}
					});

					return;
				}
			}
		};

		/**
		 * Уменьшает количество номенклатуры в корзине. При уменьшении до 0 - удаляет
		 * @param ref {String} - ссылка номенклатуры
		 */
		t.sub = function (ref) {
			var list = t.list();

			for(var i in list){
				if(list[i].ref == ref || list[i].id == ref){
					if(list[i].count > 1){
						list[i].count--;
						$p.wsql.set_user_param(prefix, list);
					}else
						t.remove(ref);
					return;
				}
			}
		};

		/**
		 * Обновляет dataview и содержимое инфопанели
		 */
		t.requery = function () {

			_cart.requery_list(t.list());

			t.bubble();

		};

		function get_elm(elm){
			while (elm = elm.parentNode){
				if(elm.getAttribute("dhx_f_id"))
					return _cart.get(elm.getAttribute("dhx_f_id"));
			}
		}

		function input_change(e){

			var val = parseInt(e.target.value),
				elm = get_elm(e.target.parentNode);

			if(isNaN(val))
				e.target.value = elm.count;
			else{
				elm.count = val;
				if(!val)
					t.remove(elm.id);
			}

			return false;
		}

		// элементы создаём с задержкой, чтобы побыстрее показать основное содержимое
		setTimeout(function () {

			// страницы карусели
			_carousel.hideControls();
			_carousel.addCell("cart");
			_carousel.addCell("order");

			_carousel.cells("cart").attachHTMLString(require("cart"));
			_container_cart = _carousel.cells("cart").cell;
			_container_cart.firstChild.style.overflow = "auto";
			_content = _container_cart.querySelector(".md_column1300");
			_dataview = _container_cart.querySelector("[name=cart_dataview]");
			_do_order = _container_cart.querySelector("[name=cart_order]");
			_dataview.style.width = (_do_order.offsetLeft - 4) + "px";
			_dataview.style.height = (_container_cart.offsetHeight - _dataview.offsetTop - 20) + "px";

			_cart = $p.iface.list_data_view({
				container: _dataview,
				height: "auto",
				type: "cart",
				custom_css: ["cart"],
				hide_pager: true
			});

			_dataview.addEventListener('change', input_change, false);

			t.bubble();

		}, 50);

		// подписываемся на событие добавления в корзину
		dhx4.attachEvent("order_cart", t.add);
	}

	if(!$p.iface._cart)
		$p.iface._cart = new OViewCart();

	if(!_requered && $p.job_prm.parse_url().view == "cart")
		setTimeout($p.iface._cart.requery, 200);

	return $p.iface._cart;

};
