/**
 * Общие методы интерфейса вебмагазина
 * Created 27.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_metastore_common
 */

$p.iface.list_data_view = function(attr){

	// пагинация
	var div_pager = document.createElement('div'),

	// контейнер dataview
		div_dataview = document.createElement('div'),

	// внешний контейнер dataview
		div_dataview_outer = document.createElement('div'),

	// внешний для внешнего контейнер dataview
		container,

	// указатель на dataview и параметры dataview
		dataview, dataview_attr;

	if(attr.container instanceof dhtmlXCellObject){
		container = document.createElement('div');
		attr.container.attachObject(container);
		container.style.width = "100%";
		container.style.height = "100%";
	}else{
		container = attr.container;
		delete attr.container;
	}

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
		type: attr.type || "list",
		custom_css: attr.custom_css || true,
		autowidth: 1,
		pager: {
			container: div_pager,
			size:30,
			template: "{common.prev()}<div class='paging_text'> Страница {common.page()} из #limit#</div>{common.next()}"
		},
		fields: ["ref", "name"],
		select: attr.select || true
	};
	if(attr.hide_pager)
		delete dataview_attr.pager;
	if(dataview_attr.type != "list" && !attr.autowidth)
		delete dataview_attr.autowidth;
	if(attr.drag)
		dataview_attr.drag = true;

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

		var hprm,
			dv_obj = {};

		for(var i=0; i<ev.target.classList.length; i++){
			if(ev.target.classList.item(i).indexOf("dv_") == 0){
				hprm = true;
				break;
			}
		}

		if(!hprm){
			hprm = $p.job_prm.parse_url(),
				dv_obj = dv_obj._mixin(dataview.get(id));
			dv_obj.ref = dv_obj.id;
			dv_obj.id = dv_obj.Код;
			dv_obj._not_set_loaded = true;
			delete dv_obj.Код;
			$p.cat.Номенклатура.create(dv_obj)
				.then(function (o) {
					$p.iface.set_hash(o.ВидНоменклатуры.ref, id, hprm.frm, "catalog");
				});
		}

		return false;
	});

	// подписываемся на событие изменения размера во внешнем layout и изменение ориентации устройства
	if(attr.autosize)
		window.addEventListener("resize", function () {
			setTimeout(function () {
				div_dataview_outer.style.height = div_dataview.style.height = container.offsetHeight + "px";
				div_dataview_outer.style.width = div_dataview.style.width = container.offsetWidth + "px";
				dataview.refresh();
			}, 600);
		}, false);

	return dataview;

};

dhtmlXDataView.prototype.get_elm = function(elm){
	while (elm = elm.parentNode){
		if(elm.getAttribute && elm.getAttribute("dhx_f_id"))
			return this.get(elm.getAttribute("dhx_f_id"));
	}
};