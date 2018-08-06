var step = 0;

// Armazenando quantas telas tem, determinar a porcentagem de cada uma
var screen_qty = $('section.screen').length;
var screen_perc = 100 / (screen_qty-1);

// Armazenando tamanho do tÃ­tulo da porcentagem 
// (valor inicial de 2rem Ã© para nunca ser usado, estÃ¡ apenas para seguranÃ§a)
var perc_fontsize = "2rem";

// DefiniÃ§Ã£o do tempo mÃ­nimo entre 2 apertos de setas do teclado (em milisegundos)
var cooldown_arrows = 600;
var allow_arrows = true;

$(document).ready(function(){

	showStep(step);

	checkHeader();
	insertGETParams();

	$("#revenue_increase")
		.slider({
			min: 0,
			max: 200,
			step: 5,
			value: 0,
		})
		.slider("pips", {
			first: "pip",
			last: "pip"
		})
		.on("slide", function(e,ui) {
			$("#revenue_increase_value")
				.text( number_format(ui.value,0,',','.') + ' %');
			$('input.revenue_increase_value').val(ui.value);
		})
	;

	$('#funcionarios').select2();
	$('#market').select2();

	$("#float_revenue").maskMoney({allowZero: true});

	// Se apertar setas, avanÃ§a/retorna tela
	// Esta funcionalidade tem um perÃ­odo de "cooldown" definida por cooldown_arrows
	$(this).keydown(function(e) {
		if(allow_arrows){
			switch(e.which) {
				case 37: // left
					if($('section.step'+step+' button.prev').length){
						$('section.step'+step+' button.prev').click();
						allow_arrows = false;
						setTimeout(function(){ allow_arrows = true; },cooldown_arrows);
					}
				break;

				case 39: // right
					if($('section.step'+step+' button.next').length){
						$('section.step'+step+' button.next').click();
						allow_arrows = false;
						setTimeout(function(){ allow_arrows = true; },cooldown_arrows);
					}
				break;

				default: return;
			}
			e.preventDefault();			
		}
	});

	$(this).on('click','button.next',function(e){
		e.preventDefault();

		// Se input Ã© vÃ¡lido avanÃ§a. Se nÃ£o for vÃ¡lido, jÃ¡ trata dentro da funÃ§Ã£o
		if(validateInput()){
			// Quantidade de passos avanÃ§ados
			var qty = 1;

			// Tratando exceÃ§Ãµes
			// - Visita Ã  loja fÃ­sica somente se b2c ou ambos E produtos ou ambos
			if(
				$('section.step'+(step+1)).hasClass('visitinc') && 
				( $('input.sellsto:checked').val() == 'B2B' || $('input[name="ServiÃ§o ou Produto"]:checked').val() == 'ServiÃ§o' ) 
			){
				qty = 2;
			}

			// AÃ§Ãµes adicionais
			// - Copia o e-mail preenchido no primeiro passo, para o campo de e-mail do Ãºltimo passo
			if($('section.step'+step).hasClass('email')){
				$('#end_email').val($('#email').val());
			}

			// - Exibe o perÃ­odo correto no slider de aumento de faturamento
			if($('section.step'+step).hasClass('timeconsume')){
				var text = $('input.timeconsume:checked').val();
				$('span.revenue-period').text(text);
			}

			// Se este passo possui classe send-rd, manda estado atual para RD station
			if($('section.step'+step).hasClass('send-rd')){
				var ident = $('section.step'+step).data('ident');
				$('form input[name="ident"]').val(ident);

				var form_serial = $('form').serialize();

				if($('section.step'+step).hasClass('email')){

					var form_inputs = {};
					$.each($('form').serializeArray(), function(i, field) {
						var requiredFields = ["email"];
						if (requiredFields.indexOf(field.name) > -1) {
							form_inputs[field.name] = field.value;
						} 
					});

					fbq('trackCustom','IniciouCalculadora',form_inputs);
				}

				// Se estiver no Ãºltimo passo, manda tambÃ©m para o facebook
				if($('section.step'+step).hasClass('end-email')){

					var form_inputs = {};
					$.each($('form').serializeArray(), function(i, field) {
						var requiredFields = ["email", "Tipo de venda", "ServiÃ§o ou Produto", "funcionarios", "Mercado em que atua", "Modelo SaaS", "Venda recorrente", "Local onde estÃ£o os clientes", "city_id", "Faturamento Anual", "Tempo Planejamento", "Tem Loja FÃ­sica", "Vende por e-commerce", "Objetivo com o marketing digital", "NÃ­vel de ConcorrÃªncia", "PretensÃ£o Aumento em Receita", "Nome", "Empresa"];
						if (requiredFields.indexOf(field.name) > -1) {
							form_inputs[field.name] = field.value;
						} 
					});

					fbq('trackCustom','CompletouCalculadora',form_inputs);
				}

				$.ajax({
					type: 'POST',
					data: form_serial,
					url: 'sendrd.php',
					success: function(r){
						console.log(r);
					}
				})
			}

			// AvanÃ§a passo(s)
			advanceStep(qty);
		}
	});

	$(this).on('click','button.prev',function(e){
		e.preventDefault();

		// Quantidade de passos para voltar
		var qty = 1;

		// Tratando exceÃ§Ãµes
		// - Visita Ã  loja fÃ­sica somente se b2c ou ambos
		if(
			$('section.step'+(step-1)).hasClass('visitinc') && 
			( $('input.sellsto:checked').val() == 'B2B' || $('input[name="ServiÃ§o ou Produto"]:checked').val() == 'ServiÃ§o' ) 
		){
			qty = 2;
		}

		// Recua passo(s)
		retreatStep(qty);
	});

	$(this).on('click','section.screen li',function(){
		$(this).siblings('li').removeClass('active');
		$(this).addClass('active');
		var value = $(this).data('value');

		$(this).siblings('input[type="hidden"]').val(value);
	});

	// Ao clicar em um botÃ£o de ajuda
	$(this).on('click','span.help .qmark',function(){
		$(this).closest('.help').addClass('big');
	});

	// Ao clicar para fechar a ajuda
	$(this).on('click','button.close-help',function(e){
		e.preventDefault();

		$(this).parents('span.help').removeClass('big');

		e.stopPropagation();
	});

	// Ao clicar para escolher um item do tipo radio
	$(this).on('click','.radio-item',function(e){
		e.preventDefault();

		$(this).siblings().removeClass('active');
		$(this).addClass('active');
		$(this).children('input[type="radio"]').prop('checked',true);
	});

	// Entra hover material items
	$(this).on('mouseenter','.material-list a',function(e){
		e.preventDefault();

		$(this).find('.hover-bg').fadeIn();
		$(this).find('.hover-text').fadeIn();
	});

	// Sai hover material items
	$(this).on('mouseleave','.material-list a',function(e){
		e.preventDefault();

		$(this).find('.hover-bg').fadeOut();
		$(this).find('.hover-text').fadeOut();
	});

	// Ao alterar o campo de cidade
	/*
	$(this).on('change','#city_id',function(e){
		var data = $(this).select2('data');
		var cidade;
		if($(this).val() && typeof data !== 'undefined'){
			cidade = data.name + ' - ' + data.state;
		}
		else{
			cidade = '';
		}

		$('#cidade').val(cidade);
	});
	*/
	$('.help-img').click(function() {
		$(this).toggleClass('open-help-info');
	});
	$('.close-help').click(function() {
		$('img.open-help-info').removeClass('open-help-info');
	});
});

// Manualmente chama um passo (debug)
function showStep(number){
	$('.step'+number).css("left","0");
}

// AvanÃ§a qty passos
function advanceStep(qty){
	qty = typeof qty !== "undefined" ? qty : 1;

	// Se existir um prÃ³ximo passo
	if($('.step'+(step+qty)).length){
		// Se for primeiro passo, aparece barra de progresso
		if(step == 0){
			perc_fontsize = $('.progress p').css("font-size");

			$('.progress').animate({
				marginTop: "-1vh"
			},500);
			$('.progress p').animate({
				fontSize: "1.5rem",
			}, 500, function(){
				$('.progress .bar').fadeIn(300);
			});
		}

		// Se for Ãºltimo prestep (indo para um step normal), exibe barra de progresso
		if($('.step'+step).hasClass('prestep') && !$('.step'+(step+qty)).hasClass('prestep')){
			showProgress();
		}

		// Movimenta as telas
		for(i=step;i<step+qty;i++){
			$('.step'+i).animate({
				left: "-100vw",
			}, 500);
		}

		step += qty;

		// Se for o Ãºltimo passo, configura animaÃ§Ã£o para subir a barra de progresso
		var upbar = function(){};
		if($('.step'+step).hasClass('last-step')){
			upbar = function(){
				$('section.title').animate({
					backgroundColor: "green",
				}, 100, function(){
					$('section.title').animate({
						backgroundColor: "#064d85",
					}, 500, function(){
						setTimeout(function(){
							$('section.title').animate({
								marginTop: "-20vh",
							}, 500);
							$('section.last-step').css('position','relative');
							$('section.last-step .results-higher').animate({
								marginTop: "-20vh",
							}, 500);
						},1000);
					});
				});
			};
		}

		$('.step'+step).animate({
			left: "0vw",
		}, 500, upbar);

		// Calcula porcentagem atual e atualiza barra
		var cur_perc = step * screen_perc;

		$('.bar .fill').animate({
			width: cur_perc+'%'
		},500);

		changeSpan(Math.round(cur_perc));

		// Altera descriÃ§Ã£o do progresso
		changeProgress($('.step'+step).data('progress'));

		// Verifica se exibe/esconde header
		checkHeader();
	}
}

// Recua qty passos
function retreatStep(qty){
	qty = typeof qty !== "undefined" ? qty : 1;

	// Se existir um passo anterior
	if($('.step'+(step-qty)).length){
		// Se voltar para o primeiro passo, remove barra de progresso
		if(step-qty == 0){
			$('.progress .bar').fadeOut(300,function(){
				$('.progress p').animate({
					fontSize: perc_fontsize,
				}, 500);

				$('.progress').animate({
					marginTop: "1vh"
				},500);
			});
		}

		// Se for step normal indo pra um prestep, esconde barra de progresso
		if(!$('.step'+step).hasClass('prestep') && $('.step'+(step-qty)).hasClass('prestep')){
			hideProgress();
		}
		// Movimenta as telas
		for(i=step;i>step-qty;i--){
			$('.step'+i).animate({
				left: "100vw",
			}, 500);
		}

		step -= qty;

		$('.step'+step).animate({
			left: "0vw",
		}, 500);

		// Calcula porcentagem atual e atualiza barra
		var cur_perc = step * screen_perc;

		$('.bar .fill').animate({
			width: cur_perc+'%'
		},500);

		changeSpan(Math.round(cur_perc));

		// Altera descriÃ§Ã£o do progresso
		changeProgress($('.step'+step).data('progress'));

		// Verifica se exibe/esconde header
		checkHeader();
	}
}

function changeSpan(number){
	// Calcula quanto deve aumentar em 500ms
	var curr = $('.bar .fill span').text();
	// remove % e transforma em inteiro
	if(curr.length > 1){
		curr = curr.slice(0, -1);
		curr = parseInt(curr);	
	}
	else{
		curr = 0;
	}

	// diferenÃ§a
	var diff = Math.abs(number - curr);
	// calcula a cada quantos ms deve aumentar 1 nÃºmero
	var delay = 500 / diff;
	// chama funÃ§Ã£o recursiva que altera o span
	recursiveChangeSpan(curr,number,delay);
}

function changeProgress(text){
	if(typeof text !== 'undefined' && text.length)
		$('.progress > p').html(text);
	else
		$('.progress > p').html('CALCULADORA DE <strong>BUDGET</strong>');
}

function recursiveChangeSpan(curr,max,delay){
	var update = false;

	if(curr < max){
		curr++;
		update = true;
	}
	else if(curr > max){
		curr--;
		update = true;
	}

	if(update){
		$('.bar .fill span').text(curr+'%');
		setTimeout(function(){ recursiveChangeSpan(curr,max,delay) },delay);		
	}
}

// FUNÃ‡ÃƒO INUTILIZADA (?) - Recalcula os pontos do slider de valor de aumento de faturamento
function recalcSlider(value){
	var $revenue = $('#revenue_increase');

	$('<div id="revenue_increase" class="slider"></div>').insertBefore($revenue);
	$revenue.remove();

	$('#revenue_increase')
		.slider({
			min: 0,
			max: parseInt(value*2),
			step: parseInt(value/20),
			value: 0,
		})
		.slider("pips", {
			first: "pip",
			last: "pip"
		})
		.on("slide", function(e,ui) {
			$("#revenue_increase_value")
				.text( 'R$ ' + number_format(ui.value,2,',','.') );
		})
	;
}

function number_format (number, decimals, decPoint, thousandsSep) {
	number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
	var n = !isFinite(+number) ? 0 : +number
	var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
	var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
	var dec = (typeof decPoint === 'undefined') ? '.' : decPoint
	var s = ''

	var toFixedFix = function (n, prec) {
	var k = Math.pow(10, prec)
	return '' + (Math.round(n * k) / k)
		.toFixed(prec)
	}

	s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
	if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
	}
	if ((s[1] || '').length < prec) {
		s[1] = s[1] || ''
		s[1] += new Array(prec - s[1].length + 1).join('0')
	}

	return s.join(dec)
}

// funÃ§Ã£o para validaÃ§Ã£o do input de cada passo
function validateInput(){
	var valid = true;
	var val;
	var $el;

	// ValidaÃ§Ã£o de cidade
	if($('section.step'+step+' #city_id').length){
		if($('#city_id').val().length){
			return true;
		}

		val = false;

		$el = $('section.step'+step+' .select2-default');

		errorIn = {
			borderColor: 'red',
		};

		errorOut = {
			borderColor: 'transparent',
		};
	}
	// ValidaÃ§Ã£o do campo faturamento (nÃ£o pode ser R$ 0,00)
	else if($('section.step'+step+' #float_revenue').length){
		if($('#float_revenue').val().length && $('#float_revenue').val() != 'R$ 0,00'){
			return true;
		}

		val = false;

		$el = $('section.step'+step+' input');

		var bordercolor = $el.css('border-bottom-color');
		var fontcolor = $el.css('color');

		errorIn = {
			borderColor: 'red',
			color: 'red',
		};

		errorOut = {
			borderColor: bordercolor,
			color: fontcolor,
		};
	}
	else if($('section.step'+step+' input[type="radio"]').length){
		$el = $('section.step'+step+' input[type="radio"]');
		val = $('section.step'+step+' input:checked').val();
	}
	else if ($('section.step'+step+' select').length) {
		return valid;
	}
	else if($('section.step'+step+' input').length){
		$el = $('section.step'+step+' input');
		val = $el.val();

		var bordercolor = $el.css('border-bottom-color');
		var fontcolor = $el.css('color');

		errorIn = {
			borderColor: 'red',
			color: 'red',
		};

		errorOut = {
			borderColor: bordercolor,
			color: fontcolor,
		};
	}
	else{
		// nÃ£o tem inputs, Ã© vÃ¡lido
		return true;
	}

	if(typeof val === "undefined" || !val){
		valid = false;
	}
	else{
		// ExceÃ§Ãµes
		if($el.hasClass('email')){
			valid = validateEmail(val);
		}
	}

	if(!valid){
		$el.focus();
		$el.animate(errorIn, 0, function(){
			$el.animate(errorOut, 400);
		});
	}

	return valid;
}

// regex para validaÃ§Ã£o de e-mail
function validateEmail(email) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}

// Exibe barra de progresso
function showProgress(){
	$('section.title').animate({
		marginTop: "70px",
	}, 500);
}

// Esconde barra de progresso
function hideProgress(){
	$('section.title').animate({
		marginTop: "-20vh",
	}, 500);
}

// Verifica se, para o passo atual, deve ou nÃ£o exibir o header
function checkHeader(){
	if($('section.step'+step).hasClass('no-header')){
		$('header').animate({
			marginTop: "-100px",
		}, 500);
	}
	else{
		$('header').animate({
			marginTop: "0px",
		}, 500);
	}
}

// Insere parÃ¢metros GET no formulÃ¡rio para ser enviado ao RD
function insertGETParams(){

	document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
	    function decode(s) {
	        return decodeURIComponent(s.split("+").join(" "));
	    }

	    var var_name = decode(arguments[1]);
	    var var_value = decode(arguments[2]);

	    $('<input />')
	    	.attr('name',var_name)
	    	.attr('value',var_value)
	    	.attr('type','hidden')
	    	.prependTo('form')
	    ;
	});

}