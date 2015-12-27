/**
 *
 * Created 07.11.2015<br />
 * &copy; http://www.oknosoft.ru 2014-2015
 * @license content of this file is covered by Oknosoft Commercial license. Usage without proper license is prohibited. To obtain it contact info@oknosoft.ru
 * @author    Evgeniy Malyarov
 * @module  wdg_multi_reviews
 */

/**
 * ### Визуальный компонент - отзывы о товаре с Яндекс.Маркета
 * - Показывает список отзывов
 * - "https://api.content.market.yandex.ru/v1/model/" + id + "/opinion.json"
 *
 * @class OMarketReviews
 * @param container {HTMLElement} - div, в котором будет расположен компонент
 * @constructor
 */
function OMarketReviews(container) {

	var _model, _empty;

	function empty_text(){
		if(!_empty){
			container.innerHTML = '<p class="text">Пока нет ни одного комментария, ваш будет первым</p>';
			_empty = true;
		}
	}

	empty_text();

	// подписываемся на сообщения socket_msg
	dhx4.attachEvent("socket_msg", function (data) {
		if(!data || !data.rows || data.type != "opinion")
			return;
		data.rows.forEach(function (opinion) {
			if(opinion.model == _model){
				if(_empty){
					container.innerHTML = '';
					_empty = false;
				}
				opinion.opinion.forEach(function (op) {
					container.innerHTML += '<p class="text">' + op.pro + '</p>';
				});
			}
		});
	});

	this.__define({

		model: {
			get: function () {
				return _model;
			},
			set: function (v) {
				if(_model == v)
					return;
				_model = v;
				empty_text();

				// запрашиваем у сокет-сервера отзывы с Маркета
				if(_model)
					$p.eve.socket.send({type: "opinion", model: _model});
			}
		}
	});

};


