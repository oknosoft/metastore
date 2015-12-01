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
			_container_order,
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
				$p.msg.show_msg((nom.НаименованиеПолное || nom.name) + " добавлен в корзину");
			}
			$p.wsql.set_user_param(prefix, list);

			t.requery()
				.then(function () {
					_cart.select(nom.ref);
				});

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
		t.sub = function (ref, val) {
			var list = t.list();

			function save_and_requery(){
				$p.wsql.set_user_param(prefix, list);
				t.requery()
					.then(function () {
						_cart.select(ref);
					});
			}

			for(var i in list){
				if(list[i].ref == ref || list[i].id == ref){
					if(val){
						list[i].count = val;
						save_and_requery();

					}else if(val == undefined && list[i].count > 1){
						list[i].count--;
						save_and_requery();

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

			t.bubble();

			return _cart.requery_list(t.list());

		};


		function cart_input_change(e){

			var val = parseInt(e.target.value),
				elm = _cart.get_elm(e.target);

			if(isNaN(val))
				e.target.value = elm.count;
			else{
				elm.count = val;
				t.sub(elm.id, val);
			}

			return false;
		}

		function cart_click(e){

			var target = e.target,
				elm = _cart.get_elm(e.target);

			if(elm){

				if(target.classList.contains("dv_icon_plus"))
					t.add(elm.id);

				else if(target.classList.contains("dv_icon_minus"))
					t.sub(elm.id);

				else if(target.classList.contains("dv_input"))
					setTimeout(function () {
						target.focus();
						target.select();
						target = null;
					}, 300);
			}

		}

		// элементы создаём с задержкой, чтобы побыстрее показать основное содержимое
		setTimeout(function () {

			// страницы карусели
			_carousel.hideControls();
			_carousel.addCell("cart");
			_carousel.addCell("checkout");

			// корзина
			_carousel.cells("cart").attachHTMLString(require("cart"));
			_container_cart = _carousel.cells("cart").cell;
			_container_cart.firstChild.style.overflow = "auto";
			_content = _container_cart.querySelector(".md_column1300");
			_dataview = _container_cart.querySelector("[name=cart_dataview]");
			_do_order = _container_cart.querySelector("[name=cart_order]");
			_dataview.style.width = (_do_order.offsetLeft - 4) + "px";
			_dataview.style.height = (_container_cart.offsetHeight - _dataview.offsetTop - 20) + "px";

			window.addEventListener("resize", function () {
				setTimeout(function () {
					var s1 = _dataview.style, s2 = _dataview.firstChild.style, s3 = _dataview.firstChild.firstChild.style;
					s1.width = s2.width = s3.width = (_do_order.offsetLeft - 4) + "px";
					s1.height = s2.height = s3.height = (_container_cart.offsetHeight - _dataview.offsetTop - 20) + "px";
					_cart.refresh();
				}, 600);
			}, false);

			_cart = $p.iface.list_data_view({
				container: _dataview,
				height: "auto",
				type: "cart",
				custom_css: ["cart"],
				hide_pager: true,
				autowidth: true
			});

			_dataview.addEventListener('change', cart_input_change, false);
			_dataview.addEventListener('click', cart_click, false);

			t.bubble();

			// обработчик кнопки "оформить"
			_container_cart.querySelector("[name=order_order]").onclick =
				_container_cart.querySelector(".dv_icon_card").onclick = function () {
					_carousel.cells("checkout").setActive();
				};

			// оформление заказа
			_carousel.cells("checkout").attachHTMLString(require("checkout"));
			_container_order = _carousel.cells("checkout").cell;

			baron({
				root: '.wdg_product_checkout',
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


			// кнопка "вернуться к списку"
			new $p.iface.OTooolBar({
				wrapper: _container_order.querySelector("[name=header]"),
				width: '28px',
				height: '29px',
				top: '0px',
				right: '20px',
				name: 'back',
				class_name: "",
				buttons: [
					{name: 'back', text: '<i class="fa fa-long-arrow-left fa-lg" style="vertical-align: 15%;"></i>', title: 'Вернуться в корзину', float: 'right'}
				],
				onclick: function (name) {
					switch (name) {
						case "back":
							_carousel.cells("cart").setActive();
							break;
					}
				}
			});

			// клик выбора платежной системы
			_container_order.querySelector("[name=billing_kind]").onclick = function (ev) {

				if(ev.target.tagName == "A"){
					var provider;
					$("li", this).removeClass("active");
					ev.target.parentNode.classList.add("active");
					for(var i=0; i<ev.target.classList.length; i++){
						if(ev.target.classList.item(i).indexOf("logo-") == 0){
							provider = ev.target.classList.item(i).replace("logo-", "") + "-container";
							break;
						}
					}
					$(".billing-system", this.querySelector(".billing-systems-container")).each(function (e, t) {
						if(e.classList.contains(provider))
							e.classList.remove("hide");
						else if(!e.classList.contains("hide"))
							e.classList.add("hide");
					});

					ev.preventDefault();
					return $p.cancel_bubble(ev);
				}
			}


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
