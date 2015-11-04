/**
 *
 * Created 05.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author    Evgeniy Malyarov
 * @module  templates.js
 */

module.exports = function(getImageStyle) {
	// определяем представления DataView

	dhtmlx.Type.add(dhtmlXDataView,{
		name:"list",
		template:"http->templates/dataview_list.html",
		template_loading:"Загрузка данных...",
		height: 100,
		width: 900,
		margin: 2,
		padding:0,
		border: 1,
		image:getImageStyle
	});

	dhtmlx.Type.add(dhtmlXDataView,{
		name:"large",
		template:"http->templates/dataview_large.html",
		height: 180,
		width: 380,
		margin: 2,
		padding:2,
		border: 1,
		image:getImageStyle
	});

	dhtmlx.Type.add(dhtmlXDataView,{
		name:"small",
		template:"http->templates/dataview_small.html",
		height: 180,
		width: 220,
		margin: 2,
		padding:2,
		border: 1,
		image:getImageStyle
	});
};
