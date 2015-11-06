/**
 * Фильтр по свойствам вида элементов справочника
 *
 * Created 22.10.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author  Evgeniy Malyarov
 * @module  wdg_filter_prop
 */

/**
 * ### Визуальный компонент для установки отборов по реквизитам (в том числе - вычисляемым), свойствам и категориям элементов справочника
 * - Отображает коллекцию элементов отбора и элементы управления с доступными значениями
 * - Унаследован от [dhtmlxForm](http://docs.dhtmlx.com/form__index.html)
 * - Автоматически обновляет состав доступных свойств при изменении отбора по родителю, выполняя запрос к irest-сервису библиотеки интеграции 1С
 *
 * Особенность dhtmlx: экземпляр создаётся не конструктором, а функцией `attachPropFilter` (без `new`) и размещается в ячейке dhtmlXCellObject
 *
 * @class OPropFilter
 * @param mgr {DataManager}
 * @param attr {Object} - параметры создаваемого компонента
 * @param [callback] {Function} - если указано, будет вызвана после инициализации компонента
 * @constructor
 */
dhtmlXCellObject.prototype.attachPropFilter = function(mgr, attr) {

	if(!attr)
		attr = {};
	var conf = {

		},
		_parent = undefined;


	var pf = this.attachForm([
		{ type:"settings" , labelWidth:120, inputWidth:120  },
		{ type:"template" , name:"form_template_4", label:"Цена"  },
		{ type:"template" , name:"form_template_2", label:"Доступность", value:"На складе"  },
		{ type:"template" , name:"form_template_3", label:"Показать"  },
		{ type:"template" , name:"form_template_1", label:"Больше параметров"  }
	]);

	pf.__define({

		mode: {
			get: function () {

			},
			set: function (v) {

			},
			enumerable: false
		},

		parent: {
			get: function () {

			},
			set: function (v) {

			},
			enumerable: false
		},

		/**
		 * Обработчик маршрутизации
		 */
		hash_route: {
			value: function (hprm) {
				if(hprm.obj && _parent != hprm.obj){
					_parent = hprm.obj;


				}
			}
		}
	});


	$p.eve.hash_route.push(pf.hash_route);
	setTimeout(function () {
		pf.hash_route($p.job_prm.parse_url());
	}, 50);

	return pf;
};
