require('./vendor/typeahead.jquery.js');
var numeral = require('./vendor/numeral.min.js');
var Bloodhound = require('./vendor/bloodhound.js');
var _ = require('lodash');

var Calculator = (function() {

  var Monster = {
    materials: []
  };

  var Data = {
    evolutions: null,
    monsters: null
  };

  function bloodhound() {
    var monsters = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: './monsters.json',
      limit: 7
    });

    return monsters;
  }

  function initTypeahead() {
    var monsters = bloodhound();
    monsters.initialize();

    $('.typeahead').typeahead({
      autoselect: true,
      highlight: true
    },
      {
        name: 'monsters',
        display: 'name',
        source: monsters.ttAdapter(),
        templates: {
          empty: '<div class="tt-empty-msg">No matching monsters found</div>',
          suggestion: function(monster) {
            return '<div>' + monster.id + '. ' + monster.name + '</div>';
          }
        }
      }).on('typeahead:selected', function (e, monster) {
        clearEvolutions();
        showMonster(monster);
        showEvoMonsters(monster.id);

        clearEXPFields();
        $(this).blur();
        scrollToMonster();

        $('.twitter-typeahead').addClass('has-input');
      });
  }

  function getData(name) {
    if (!supportsLocalStorage || localStorage.getItem(name) === null) {
      $.getJSON('./' + name + '.json', function(data) {
        Data[name] = data;

        if (supportsLocalStorage()) {
          localStorage.setItem(name, JSON.stringify(data));
        }
      });
    } else {
      Data[name] = JSON.parse(localStorage.getItem(name));
    }
  }

  function getEvolutionsData() {
    getData('evolutions');
  }

  function getMonstersData() {
    getData('monsters');
  }

  function supportsLocalStorage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch(e) {
      return false;
    }
  }

  function scrollToMonster() {
    $('html, body').animate({
      scrollTop: $('.monster-info').offset().top - 15
    }, 300);
  }

  // bindings
  function bindEvents() {
    bindClearSearchInput();
    bindClearRemainingEXP();
    bindRemainingEXP();
    bindClearToInputs();
  }

  function bindClearSearchInput() {
    $('#clearSearchInput').bind('click', function(e) {
      e.preventDefault();

      $('.twitter-typeahead').find('.typeahead').typeahead('val', '').focus();
      $('.twitter-typeahead').removeClass('has-input');
    });
  }

  function bindClearRemainingEXP() {
    $('#clearRemainingEXP').bind('click', function(e) {
      e.preventDefault();

      clearEXPFields();
      $('#current-exp').focus();
    });
  }

  function bindRemainingEXP() {
    $('.calculator').on('keyup', '#current-exp', function() {
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
  }

  function bindClearToInputs() {
    $('input').on('keyup', function() {
      var thisParent = $(this).parent();
      $(this).val().length ? $(thisParent).addClass('has-input') : $(thisParent).removeClass('has-input');
    });
  }

  function clearEvolutions() {
    $('.evolutions').empty();
  }

  function clearEXPFields() {
    $('.current-exp-wrapper').removeClass('has-input');
    $('#current-exp').removeClass('error').val('');
    $('.remaining-exp').empty();

    toggleExpInput();
  }

  function toggleExpInput() {
    if ($('.exp-to-max span').text() !== '0') {
      $('.current-exp-wrapper').addClass('show-input');
    } else {
      $('.current-exp-wrapper').removeClass('show-input');
    }
  }

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
  }

  function translateElement(elementCode) {
    var elements = {
      0: 'Fire',
      1: 'Water',
      2: 'Wood',
      3: 'Light',
      4: 'Dark'
    };

    return elements[elementCode] || '';
  }

  function calculateMaxEXP(expCurve, maxlvl) {
    var maxExp = numeral((expCurve) * Math.pow(((maxlvl - 1) / 98), 2.5)).format('0,0') || 0;
    return maxExp;
  }

  function showMonster(monster) {
    $('.monster-info').html(function() {
      return '<img class="monster" src="images/monsters/' + monster.id + '.png" alt=' + monster.name + '>' +
              '<table class="monster-details">' +
                '<tr class="name"><td>Id:</td><td>' + monster.id + '</td></tr>' +
                '<tr class="name"><td>Name:</td><td>' + monster.name + '</td></tr>' +
                '<tr class="jp-name"><td>JP Name:</td><td>' + monster.name_jp + '</td></tr>' +
                '<tr class="type"><td>Type:</td><td>' + translateType(monster.type) + ((monster.type2 != null) ? ' / ' + translateType(monster.type2) : '') + ((monster.type3 != null) ? ' / ' + translateType(monster.type3) : '') + '</td></tr>' +
                '<tr class="element"><td>Element:</td><td>' + translateElement(monster.element) + ((monster.element2 != null) ? ' / ' + translateElement(monster.element2) : '') + '</td></tr>' +
                '<tr class="rarity"><td>Rarity:</td><td>' + monster.rarity + '</td></tr>' +
                '<tr class="cost"><td>Cost:</td><td>' + monster.team_cost + '</td></tr>' +
                '<tr class="max-lvl"><td>Max Level:</td><td>' + monster.max_level + '</td></tr>' +
                '<tr class="exp-to-max"><td>Exp to Max:</td><td><span>' +
                calculateMaxEXP(monster.xp_curve, monster.max_level) + '</span></td></tr>' +
              '</table>';
    });
  }

  function showEvoMonsters(id) {
    Monster.materials = [];
    var evolutions = Data.evolutions[id];

    if (evolutions) {
      $('.evolutions').append('<h3>Evolutions:</h3>');

      _.each(evolutions, function(evo, i) {
        var evolution = evo.evolves_to;

        $('.evolutions').append('<div class="evo-block" id="evo' + i + '"></div>');
        $('#evo' + i).append(function() {
          var img = '<img class="monster evo" src="images/monsters/' + evolution + '.png">';
          return $(img).bind('click', function(e) {
            e.preventDefault();
            selectEvoMonster(evolution);
          });
        });

        Monster.materials.push(evo.materials);
      });

      showEvoMaterials(Monster.materials);
    }
  }

  function showEvoMaterials(evos) {
    _.each(evos, function(evo, i) {
      _.each(evo, function(material) {
        var id = material[0];
        var num = material[1];

        for (var k = 0; k < num; k++) {
          $('.evolutions #evo' + i).append('<img class="material" src="images/monsters/' + id + '.png">');
        }
      });
    });
  }

  function selectEvoMonster(id) {
    var monster = _.find(Data.monsters, function(monster) {
      return monster.id === id;
    });

    if (monster) {
      $('.typeahead').trigger('typeahead:selected', monster);
      $('.typeahead').typeahead('val', monster.name);
    }
  }

  function init() {
    initTypeahead();
    getEvolutionsData();
    getMonstersData();
    bindEvents();
  }

  return {
    init: init
  };

})();

Calculator.init();