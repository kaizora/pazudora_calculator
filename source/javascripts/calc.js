var Calculator = {};

$(document).ready(function() {
  var monsterData = [];
  $.getJSON("monsters.json", function(data) {
    monsterData.push(data[0].name);
    // Calculator.Data.setLocalData(data);
    console.log(monsterData);
  });


  var monsters = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace(''),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: monsterData
  });

  monsters.initialize();

  $(".typeahead").typeahead({
    highlight: true,
    minLength: 1,
  },
  {
    name: "monsters",
    displayKey: "name",
    source: monsters.ttAdapter(),
    // templates: {
    //   suggestion: function(monster) {
    //     return "<span class='airport-code'>" + monster.name + "</span>" + " " + monster.id;
    //   }
    // }
  });

  Calculator.Data = (function() {
    return {

      getData : function() {
        $.getJSON("monsters.json", function(data) {
          monsterData = data[0].name;
          Calculator.Data.setLocalData(data);
        });
      },

      setLocalData : function(data) {
        var monsterData = localStorage.getItem('monsterData');

        if(!monsterData) {
          localStorage.setItem('monsterData', JSON.stringify(data));
        }

        console.log('Monster Data: ', JSON.parse(monsterData));
      },
    }

  })();

});