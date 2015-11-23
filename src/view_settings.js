/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_settings
 */

$p.iface.view_settings = function (cell) {

	function view_settings(){
		$p.iface._settings = {};
		cell.attachHTMLString(require('settings'));
		$p.iface._settings._cell = cell.cell.querySelector(".dhx_cell_cont_sidebar");
		$p.iface._settings._cell.style.overflow = "auto";
		$p.iface._settings._form1 = $p.iface._settings._cell.querySelector("[name=form1]");
		$p.iface._settings._form2 = $p.iface._settings._cell.querySelector("[name=form2]");
		$p.iface._settings._form3 = $p.iface._settings._cell.querySelector("[name=form3]");

		$p.iface._settings.form1 = new dhtmlXForm($p.iface._settings._form1.firstChild, [

			{ type:"settings", labelWidth:80, position:"label-left"  },

			{type: "label", labelWidth:320, label: "Тип устройства", className: "label_options"},
			{ type:"block" , name:"form_block_2", list:[
				{ type:"settings", labelAlign:"left", position:"label-right"  },
				{ type:"radio" , name:"device_type", labelWidth:120, label:'<i class="fa fa-desktop"></i> Компьютер', value:"desktop"},
				{ type:"newcolumn"   },
				{ type:"radio" , name:"device_type", labelWidth:150, label:'<i class="fa fa-mobile fa-lg"></i> Телефон, планшет', value:"phone"},
			]  },
			{type:"template", label:"",value:"",
				note: {text: "Класс устройства определяется автоматически, но пользователь может задать его явно", width: 320}},

			{type: "label", labelWidth:320, label: "Вариант оформления интерфейса", className: "label_options"},
			{type:"combo" , inputWidth: 220, name:"skin", label:"Скин", options:[
				{value: "dhx_web", text: "Web"},
				{value: "dhx_terrace", text: "Terrace"}
			]},
			{type:"template", label:"",value:"",
				note: {text: "Дополнительные свойства оформления можно задать в css", width: 320}},

			{type: "label", labelWidth:320, label: "Адрес http сервиса 1С", className: "label_options"},
			{type:"input" , inputWidth: 220, name:"rest_path", label:"Путь", validate:"NotEmpty"},
			{type:"template", label:"",value:"",
				note: {text: "Можно указать как относительный, так и абсолютный URL публикации 1С OData. " +
				"О настройке кроссдоменных запросов к 1С <a href='#'>см. здесь</a>", width: 320}},

			{type: "label", labelWidth:320, label: "Значение разделителя публикации 1С fresh", className: "label_options"},
			{type:"input" , inputWidth: 220, name:"zone", label:"Зона", numberFormat: ["0", "", ""], validate:"NotEmpty,ValidInteger"},
			{type:"template", label:"",value:"",
				note: {text: "Для неразделенной публикации, зона = 0", width: 320}}

		]);

		$p.iface._settings.form2 = new dhtmlXForm($p.iface._settings._form2.firstChild, [

			{ type:"settings", labelWidth:80, position:"label-left"  },

			{type: "label", labelWidth:320, label: "Доступные закладки", className: "label_options"},
			{
				type:"container",
				name: "views",
				inputWidth: 320,
				inputHeight: 320
			},
			{type:"template", label:"",value:"",
				note: {text: "Видимость и порядок закладок навигации", width: 320}},


		]);

		$p.iface._settings.form3 = new dhtmlXForm($p.iface._settings._form3.firstChild, [

			{ type:"settings", labelWidth:80, position:"label-left"  },
			{type: "button", name: "save", value: "Применить настройки", offsetTop: 20}

		]);

		$p.iface._settings.form1.checkItem("device_type", $p.wsql.get_user_param("device_type"));


		["zone", "skin", "rest_path"].forEach(function (prm) {
			$p.iface._settings.form1.setItemValue(prm, $p.wsql.get_user_param(prm));
		});

		$p.iface._settings.form1.attachEvent("onChange", function (name, value, state){
			$p.wsql.set_user_param(name, value);
		});

		$p.iface._settings.form3.attachEvent("onButtonClick", function(name){
			location.reload();
		});
	}

	if(!$p.iface._settings)
		view_settings();

	return $p.iface._settings;


};
