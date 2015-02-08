//= require jquery
//= require external/typeahead.bundle
//= require external/numeral.min

var Calculator = (function() {

  var pub = {
    Monster: {
      materials: []
    },
    Data: {
      evolutions: null,
      monsters: null
    }
  };

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
      Calculator.showEvoMonsters(datum.id);

      clearEXPFields();
      $(this).blur();
      scrollToMonster();

      $('.twitter-typeahead').addClass('has-input');
    });

    pub.Data.monsters = monsters;
  };

  function getEvolutionsData() {
    if (!supportsLocalStorage || localStorage.getItem('evolutions') === null) {
      $.getJSON('javascripts/evolutions.json', function(data) {
        pub.Data.evolutions = data;

        if (supportsLocalStorage()) {
          localStorage.setItem('evolutions', JSON.stringify(data));
        }
      });
    } else {
      pub.Data.evolutions = JSON.parse(localStorage.getItem('evolutions'));
    }
  };

  function supportsLocalStorage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch(e) {
      return false;
    }
  };

  function scrollToMonster() {
    $('html, body').animate({
        scrollTop: $(".monster-info").offset().top - 15
    }, 300);
  };

  // bindings
  function bindEvents() {
    bindClearSearchInput();
    bindClearRemainingEXP();
    bindRemainingEXP();
    bindClearToInputs();
  };

  function bindClearSearchInput() {
    $('#clearSearchInput').bind('click', function(e) {
      e.preventDefault();

      $('.twitter-typeahead').find('.typeahead').typeahead('val', '').focus();
      $('.twitter-typeahead').removeClass('has-input');
    });
  };

  function bindClearRemainingEXP() {
    $('#clearRemainingEXP').bind('click', function(e) {
      e.preventDefault();

      clearEXPFields();
      $('#current-exp').focus();
    });
  };

  function bindRemainingEXP() {
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

      $('.remaining-exp').html(numeral(remainingEXP).format('0,0'));
    });
  };

  function bindClearToInputs() {
    $('input').on('keyup', function() {
      var thisParent = $(this).parent();

      $(this).val().length ? $(thisParent).addClass('has-input') : $(thisParent).removeClass('has-input');
    });
  };

  function clearEXPFields() {
    $('.current-exp-wrapper').removeClass('has-input');
    $('#current-exp').removeClass('error').val('');
    $('.remaining-exp').empty();

    if ($('.exp-to-max span').text() !== '0') {
      $('.current-exp-wrapper').addClass('show-input');
    } else {
      $('.current-exp-wrapper').removeClass('show-input')
    }
  };

  // core functionality
  function translateType(typeCode) {
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
  };

  function translateElement(elementCode) {
    var elements = {
      0: 'Fire',
      1: 'Water',
      2: 'Wood',
      3: 'Light',
      4: 'Dark'
    };

    return elements[elementCode] || '';
  };

  function calculateMaxEXP(expCurve, maxlvl) {
    var maxExp = numeral((expCurve) * Math.pow( ((maxlvl - 1) / 98), 2.5 )).format('0,0');

    return maxExp || 0;
  };

  pub.init = function() {
    initTypeahead();
    getEvolutionsData();
    bindEvents();
  };

  pub.showMonster = function(datum) {
    $('.monster-info').html(function() {
      return '<img class="monster" src="images/monsters/' + datum.id + '.png" alt=' + datum.name + '>' +
              '<table class="monster-details">' +
              '<tr class="name"><td>Name:</td><td>' + datum.name + '</td></tr>' +
              '<tr class="jp-name"><td>JP Name:</td><td>' + datum.name_jp + '</td></tr>' +
              '<tr class="type"><td>Type:</td><td>' + translateType(datum.type) +
              ((datum.type2 != null) ? ' / ' + translateType(datum.type2) : '') + '</td></tr>' +
              '<tr class="element"><td>Element:</td><td>' + translateElement(datum.element) +
              ((datum.element2 != null) ? ' / ' + translateElement(datum.element2) : '') + '</td></tr>' +
              '<tr class="rarity"><td>Rarity:</td><td>' + datum.rarity + '</td></tr>' +
              '<tr class="cost"><td>Cost:</td><td>' + datum.team_cost + '</td></tr>' +
              '<tr class="max-lvl"><td>Max Level:</td><td>' + datum.max_level + '</td></tr>' +
              '<tr class="exp-to-max"><td>Exp to Max:</td><td><span>' +
              calculateMaxEXP(datum.xp_curve, datum.max_level) + '</span></td></tr>' +
              '</table>';
    });
  };

  pub.showEvoMonsters = function(id) {
    $('.evolutions').empty();

    pub.Monster.materials = [];

    if (pub.Data.evolutions[id]) {
      $('.evolutions').append('<h3>Evolutions:</h3>');

      for (var i = 0; i < pub.Data.evolutions[id].length; i++) {
        var evolution = (pub.Data.evolutions[id]) ? pub.Data.evolutions[id][i].evolves_to : '';

        if (evolution) {
          $('.evolutions').append('<div class="evo-block" id="evo' + i + '">' +
            '<img class="monster evo" onclick=javascript:Calculator.selectEvoMonster(' + evolution + '); src="images/monsters/' + evolution + '.png">' +
            '</div>');

          pub.Monster.materials.push(pub.Data.evolutions[id][i].materials);
        }
      }

      pub.showEvoMaterials(pub.Monster.materials);
    }
  };

  pub.showEvoMaterials = function(materials) {
    for (var i = 0; i < materials.length; i++) {
      for (var j = 0; j < materials[i].length; j++) {
        var id = materials[i][j][0];
        var num = materials[i][j][1];

        for (var k = 0; k < num; k++) {
          $('.evolutions #evo' + i).append('<img class="material" src="images/monsters/' + id + '.png">');
        }
      }
    }
  };

  pub.selectEvoMonster = function(id) {
    for (var i = 0; i < pub.Data.monsters.index.datums.length; i++) {
      if (id === pub.Data.monsters.index.datums[i].id) {
        $('.typeahead').trigger('typeahead:selected', pub.Data.monsters.index.datums[i]);
        $('.typeahead').typeahead('val', pub.Data.monsters.index.datums[i].name);
      }
    }
  };

  return pub;

})();

Calculator.init();