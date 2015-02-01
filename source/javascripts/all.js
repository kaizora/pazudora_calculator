//= require jquery
//= require external/typeahead.bundle
//= require external/numeral.min

var Calculator = (function() {
  var pub = {};

  function initBloodhound() {
    var monsters = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: 'javascripts/monsters.json',
      limit: 7
    });

    return monsters;
  };

  function initTypeahead() {
    var monsters = initBloodhound();

    monsters.initialize();

    $('.typeahead').typeahead({
      autoselect: true,
      highlight: true,
    },
    {
      name: 'monsters',
      displayKey: 'name',
      source: monsters.ttAdapter(),
      templates: {
        empty: '<div class="tt-empty-msg">No matching monsters found</div>',
        suggestion: function(monster) {
          return '<strong>' + monster.id + '.</strong> ' + monster.name;
        }
      }
    }).on('typeahead:selected',  function (e, datum, name) {
      Calculator.showMonster(datum);
      Calculator.showRelatedMonsters(datum.id);
      Calculator.bindRemainingEXP();
    });

    pub.monsters = monsters;
  };

  pub.init = function() {
    initTypeahead();
    this.bindEvents();
  };

  pub.bindEvents = function() {
    this.addClearToInputs();
    this.bindClearSearchInput();
    this.bindClearRemainingEXP();
  };

  pub.bindClearSearchInput = function() {
    $('#clearSearchInput').bind('click', function(e) {
      e.preventDefault();

      $('#current-exp').removeClass('error').val('');
      $(this).siblings('.twitter-typeahead').find('.typeahead').typeahead('val', '').focus();
      $(this).siblings('.twitter-typeahead').removeClass('has-input');
      $('.current-exp-wrapper').removeClass('has-input');
    });
  };

  pub.bindClearRemainingEXP = function() {
    $('#clearRemainingEXP').bind('click', function(e) {
      e.preventDefault();

      $('.current-exp-wrapper').removeClass('has-input');
      $('#current-exp').removeClass('error').val('').focus();
      $('#remaining-exp').empty();
    });
  };

  pub.bindRemainingEXP = function() {
    $('.calculator').on('keyup', '#current-exp', function(e) {
      var maxEXP = numeral().unformat($('.exp-to-max span').text());
      var currentEXP = $('#current-exp').val() || 0;
      var remainingEXP = maxEXP - currentEXP || 0;

      if (remainingEXP < 0) {
        $('#current-exp').addClass('error');
        remainingEXP = 0;
      } else {
        $('#current-exp').removeClass('error');
      }

      $('#remaining-exp').html(numeral(remainingEXP).format('0,0'));
    });
  };

  pub.addClearToInputs = function() {
    $('input').on('keyup', function() {
      var thisParent = $(this).parent();

      $(this).val().length ? $(thisParent).addClass('has-input') : $(thisParent).removeClass('has-input');
    });
  };

  pub.showMonster = function(datum) {
    $('.monster-info').html(function() {
      return '<img src="images/monsters/' + datum.id + '.png" alt=' + datum.name + '>' +
              '<table class="monster-details">' +
              '<tr class="id"><td>ID:</td><td>' + datum.id + '</td></tr>' +
              '<tr class="name"><td>Name:</td><td>' + datum.name + '</td></tr>' +
              '<tr class="jp-name"><td>JP Name:</td><td>' + datum.name_jp + '</td></tr>' +
              '<tr class="type"><td>Type:</td><td>' + Calculator.translateType(datum.type) +
              ((datum.type2 != null) ? ' / ' + Calculator.translateType(datum.type2) : '') + '</td></tr>' +
              '<tr class="element"><td>Element:</td><td>' + Calculator.translateElement(datum.element) +
              ((datum.element2 != null) ? ' / ' + Calculator.translateElement(datum.element2) : '') + '</td></tr>' +
              '<tr class="rarity"><td>Rarity:</td><td>' + datum.rarity + '</td></tr>' +
              '<tr class="cost"><td>Cost:</td><td>' + datum.team_cost + '</td></tr>' +
              '<tr class="max-lvl"><td>Max Level:</td><td>' + datum.max_level + '</td></tr>' +
              '<tr class="exp-to-max"><td>Exp to Max:</td><td><span>' +
              Calculator.calculateMaxEXP(datum.xp_curve, datum.max_level) + '</span></td></tr>' +
              '</table>';
    });

    $('#current-exp').val('');
    $('#remaining-exp').empty();

    if ( $('.exp-to-max span').text() !== '0' ) {
      $('.current-exp-wrapper').addClass('show-input');
    } else {
      $('.current-exp-wrapper').removeClass('show-input')
    }
  };

  pub.showRelatedMonsters = function(id) {

    $('#evolutions').empty();

    if (localStorage.getItem('evolutions') === null) {
      $.getJSON('javascripts/evolutions.json', function(data) {

        if (data[id]) {
          $('#evolutions').append('<p>Evolves to:</p>');

          for (var i = 0; i < data[id].length; i++) {
            var evolution = (data[id]) ? data[id][i].evolves_to : '';

            if (evolution) {
              $('#evolutions').append('<img onclick=javascript:Calculator.selectEvoMonster(' + evolution + '); src="images/monsters/' + evolution + '.png">');
            }
          }

          localStorage.setItem('evolutions', JSON.stringify(data));
        }
      });

    } else {
      var data = JSON.parse(localStorage.getItem('evolutions'));

      if (data[id]) {
        $('#evolutions').append('<p>Evolves to:</p>');

        for (var i = 0; i < data[id].length; i++) {
          var evolution = (data[id]) ? data[id][i].evolves_to : '';

          if (evolution) {
            $('#evolutions').append('<img onclick=javascript:Calculator.selectEvoMonster(' + evolution + '); src="images/monsters/' + evolution + '.png">');
          }
        }

        localStorage.setItem('evolutions', JSON.stringify(data));
      }
    }
  };

  pub.selectEvoMonster = function(id) {
    for (var i = 0; i < pub.monsters.index.datums.length; i++) {
      if ( id === pub.monsters.index.datums[i].id ) {
        $(".typeahead").trigger('typeahead:selected', pub.monsters.index.datums[i]);
      }
    }
  },

  pub.translateType = function(typeCode) {
    var types = {
      0:  'Evo Material',
      1:  'Balanced',
      2:  'Physical',
      3:  'Healer',
      4:  'Dragon',
      5:  'God',
      6:  'Attacker',
      7:  'Devil',
      12: 'Awoken Skill Material',
      13: 'Protected',
      14: 'Enhance Material'
    };

    return types[typeCode] || '';
  },

  pub.translateElement = function(elementCode) {
    var elements = {
      0: 'Fire',
      1: 'Water',
      2: 'Wood',
      3: 'Light',
      4: 'Dark'
    };

    return elements[elementCode] || '';
  },

  pub.calculateMaxEXP = function(expCurve, maxlvl) {
    var maxExp = numeral((expCurve) * Math.pow( ((maxlvl - 1) / 98), 2.5 )).format('0,0');

    return maxExp || 0;
  }

  return pub;

})();

Calculator.init();