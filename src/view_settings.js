/**
 *
 * Created 24.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  view_settings
 */

$p.iface.set_view_settings = function (cell) {

	if($p.iface._settings)
		return;

	$p.iface._settings = {
		form: cell.attachForm([
			{ type:"settings", labelWidth:80, offsetLeft: 16, position:"label-left"  },

			{type: "label", labelWidth:400, label: "Тип устройства", className: "label_options"},
			{ type:"block" , name:"form_block_2", list:[
				{ type:"settings", labelAlign:"left", position:"label-right"  },
				{ type:"radio" , name:"device_type", label:"Компьютер", value:"desktop"},
				{ type:"newcolumn"   },
				{ type:"radio" , name:"device_type", label:"Телефон", value:"phone"},
				{ type:"newcolumn"   },
				{ type:"radio" , name:"device_type", label:"Планшет", value:"tablet"}
			]  },
			{type:"template", label:"",value:"",
				note: {text: "Класс устройства определяется автоматически, но пользователь может задать его явно", width: 400}},

			{type: "label", labelWidth:400, label: "Значение разделителя публикации 1С fresh", className: "label_options"},
			{type:"input" , inputWidth: 200, name:"zone", label:"Зона", numberFormat: ["0", "", ""], validate:"NotEmpty,ValidInteger"},
			{type:"template", label:"",value:"",
				note: {text: "Для неразделенной публикации, зона = 0", width: 400}},

			{type: "label", labelWidth:400, label: "Вариант оформления dhtmlx", className: "label_options"},
			{type:"combo" , inputWidth: 200, name:"skin", label:"Скин", options:[
				{value: "dhx_web", text: "Web"},
				{value: "dhx_terrace", text: "Terrace"}
			]},
			{type:"template", label:"",value:"",
				note: {text: "Дополнительные свойства оформления можно задать в css", width: 400}},

		])
	};

	$p.iface._settings.form.checkItem("device_type", $p.wsql.get_user_param("device_type"));
	["zone", "skin"].forEach(function (prm) {
		$p.iface._settings.form.setItemValue(prm, $p.wsql.get_user_param(prm));
	});


	$p.iface._settings.form.attachEvent("onChange", function (name, value, state){
		$p.wsql.set_user_param(name, value);
	});


};
