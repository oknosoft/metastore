/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_orders
 */

$p.iface.view_orders = function (cell) {

	function OViewOrders(){

		var t = this,
			attr = {url: ""},
			def_prm = {
				hide_header: true,
				hide_filter: true,
				date_from: new Date("2012-01-01")
			};

		t.tabs = cell.attachTabbar({
			arrows_mode:    "auto",
			tabs: [
				{id: "orders", text: '<i class="fa fa-suitcase"></i> Заказы', active: true},
				{id: "pays", text: '<i class="fa fa-money"></i> Оплаты'},
				{id: "shipments", text: '<i class="fa fa-shopping-bag"></i> Продажи'},
				{id: "balance", text: '<i class="fa fa-balance-scale"></i> Баланс'}
			]
		});

		// получаем список доступных текущему пользователю партнеров, договоров и контрагентов
		if($p.cat.Контрагенты.find()){
			t.orders = $p.doc.ЗаказКлиента.form_list(t.tabs.cells("orders"), def_prm);

		}else{
			$p.rest.build_select(attr, {
				rest_name: "Module_ИнтеграцияСИнтернетМагазином/СправочникиПользователя/",
				class_name: "cat.Пользователи"
			});
			$p.ajax.get_ex(attr.url, attr)
				.then(function (req) {
					$p.eve.from_json_to_data_obj(req);
				})
				.then(function (data) {
					t.orders = $p.doc.ЗаказКлиента.form_list(t.tabs.cells("orders"), def_prm);
				})
				.catch(function (err) {
					$p.record_log(err);
				});
		}


		// обработчик при изменении закладки таббара
		t.tabs.attachEvent("onSelect", function (id) {
			if(!t[id]){
				if(id == "pays"){
					t[id] = t.tabs.cells(id).attachTabbar({
						arrows_mode:    "auto",
						tabs: [
							{id: "bank", text: '<i class="fa fa-university"></i> Банк'},
							{id: "card", text: '<i class="fa fa-credit-card"></i> Карта'},
							{id: "cache", text: '<i class="fa fa-money"></i> Наличные'},
							{id: "refunds", text: '<i class="fa fa-undo"></i></i> Возвраты'}
						]
					});

					t[id].attachEvent("onSelect", function (subid) {
						if(!t[id + "_" + subid]) {
							if (subid == "bank") {
								t[id + "_" + subid] = $p.doc.ПоступлениеБезналичныхДенежныхСредств.form_list(t[id].cells(subid), def_prm);

							}else if(subid == "card") {
								t[id + "_" + subid] = $p.doc.ОперацияПоПлатежнойКарте.form_list(t[id].cells(subid), def_prm);

							}else if(subid == "cache") {
								t[id + "_" + subid] = $p.doc.ПриходныйКассовыйОрдер.form_list(t[id].cells(subid), def_prm);

							}else if(subid == "refunds") {
								t[id + "_" + subid] = $p.doc.РасходныйКассовыйОрдер.form_list(t[id].cells(subid), def_prm);

							}
						}
						return true;
					});

					t[id].cells("bank").setActive();

				}else if(id == "shipments"){

					t[id] = t.tabs.cells(id).attachTabbar({
						arrows_mode:    "auto",
						tabs: [
							{id: "shipments", text: '<i class="fa fa-truck"></i> Отгрузки'},
							{id: "refunds", text: '<i class="fa fa-undo"></i></i> Возвраты'}
						]
					});

					t[id].attachEvent("onSelect", function (subid) {
						if(!t[id + "_" + subid]) {
							if (subid == "shipments") {
								t[id + "_" + subid] = $p.doc.РеализацияТоваровУслуг.form_list(t[id].cells(subid), def_prm);

							}else if(subid == "refunds") {
								t[id + "_" + subid] = $p.doc.ВозвратТоваровОтКлиента.form_list(t[id].cells(subid), def_prm);

							}
						}
						return true;
					});

					t[id].cells("shipments").setActive();

				}else if(id == "balance"){


				}
			};
			return true;
		});

	}

	if(!$p.iface._orders)
		$p.iface._orders = new OViewOrders();

	return $p.iface._orders;

};
