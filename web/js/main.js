; (function () {

	'use strict';


	var dropdown = function () {

		$('.has-dropdown').mouseenter(function () {

			var $this = $(this);
			$this
				.find('.dropdown')
				.css('display', 'block')
				.addClass('animated-fast fadeInUpMenu');

		}).mouseleave(function () {
			var $this = $(this);

			$this
				.find('.dropdown')
				.css('display', 'none')
				.removeClass('animated-fast fadeInUpMenu');
		});

	};

	var hmtabs = function () {

		// Auto adjust height
		$('.gtco-tab-content-wrap').css('height', 0);
		var autoHeight = function () {

			setTimeout(function () {

				var tabContentWrap = $('.gtco-tab-content-wrap'),
					tabHeight = $('.gtco-tab-nav').outerHeight(),
					formActiveHeight = $('.tab-content.active').outerHeight(),
					totalHeight = parseInt(tabHeight + formActiveHeight + 90);

				tabContentWrap.css('height', totalHeight);

				$(window).resize(function () {
					var tabContentWrap = $('.gtco-tab-content-wrap'),
						tabHeight = $('.gtco-tab-nav').outerHeight(),
						formActiveHeight = $('.tab-content.active').outerHeight(),
						totalHeight = parseInt(tabHeight + formActiveHeight + 90);

					tabContentWrap.css('height', totalHeight);
				});

			}, 100);

		};

		autoHeight();


		// Click tab menu
		$('.gtco-tab-nav a').on('click', function (event) {

			var $this = $(this),
				tab = $this.data('tab');

			$('.tab-content')
				.addClass('animated-fast fadeOutDown');

			$('.tab-content')
				.removeClass('active');

			$('.gtco-tab-nav li').removeClass('active');

			$this
				.closest('li')
				.addClass('active')

			$this
				.closest('.gtco-tabs')
				.find('.tab-content[data-tab-content="' + tab + '"]')
				.removeClass('animated-fast fadeOutDown')
				.addClass('animated-fast active fadeIn');


			autoHeight();
			event.preventDefault();

		});
	};


	var loaderPage = function () {
		$(".gtco-loader").fadeOut("slow");
	};

	$(function () {
		$("#extabs").tabs();
		$("#status").selectmenu();
		dropdown();
		hmtabs();
		loaderPage();
		dropdown();
	});


}());