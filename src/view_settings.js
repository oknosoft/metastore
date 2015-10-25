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
			{ type:"fieldset" , name:"device_type", label:"Тип устройства", labelAlign:"left", list:[
				{ type:"block" , name:"form_block_2", list:[
					{ type:"settings" , labelWidth:80, labelAlign:"left", position:"label-right"  },
					{ type:"radio" , name:"device_type_form_radio", label:"Компьютер", value:"desktop"},
					{ type:"newcolumn"   },
					{ type:"radio" , name:"device_type_form_radio", label:"Телефон", value:"phone"},
					{ type:"newcolumn"   },
					{ type:"radio" , name:"device_type_form_radio", label:"Планшет", value:"tablet"}
				]  },
				{ type:"template" , name:"form_template_1", label:"<span style='color: #888'>Класс устройства определяется автоматически, но пользователь может задать его явно</span>" }
			]  },
			{ type:"fieldset" , name:"zone", label:"Зона публикации 1С fresh", labelAlign:"left", list:[
				{ type:"input" , name:"zone_form_input", label:"Значение разделителя", numberFormat: ["0", "", ""], validate:"NotEmpty,ValidInteger" },
				{ type:"template" , name:"form_template_2", label:"<span style='color: #888'>Для неразделенной публикации, зона = 0</span>" }
			]  }
		])
	};

	$p.iface._settings.form.checkItem("device_type_form_radio", $p.wsql.get_user_param("device_type"));
	$p.iface._settings.form.setItemValue("zone_form_input", $p.wsql.get_user_param("zone"));

	$p.iface._settings.form.attachEvent("onChange", function (name, value, state){
		if(name == "device_type_form_radio" && state)
			$p.wsql.set_user_param("device_type", value);
	});


};
