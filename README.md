Pazudora EXP Calculator
===================
This is a [Puzzle & Dragons](http://www.gunghoonline.com/games/puzzle-dragons/) tool to calculate the remaining EXP needed to max out a monster. It's written in Javascript and built using the following libraries/tool:
 
- [jQuery](https://jquery.com/) 
- [Twitter Typeahead](https://twitter.github.io/typeahead.js/)
- [numeral.js](http://numeraljs.com/)
- [lodash](https://lodash.com/)
- [webpack](https://webpack.github.io/)
- [eslint](http://eslint.org/)

Original idea was from www.puzzledragonx.com/. I decided to redesign a particular section/tool of their monster page and to try to make it a faster/better experience.

Thank you [PADHerder](https://www.padherder.com/) for providing their API with neatly organized JSON files to make this tool possible with the data. All the data are from other sources credited in their credits, I simply made the UI/UX since Puzzle Dragon X Database has been slow and chunky for me.

Potential Future Features:
----
- Include Evo chain on monster info
- Most recent searches / most popular searches (requires back-end integration)
- Local storage to store previously entered exp for searched monsters (?)
- UI theme changer (allows for user to change the skin of the UI)
- Monster tabbing? (allows user to have more than one monster "tab" open at once within the page)
- Monster bookmarking