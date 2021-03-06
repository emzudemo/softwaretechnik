// Do not pollute the global scope

(function() { // IIFE
  // http://benalman.com/news/2010/11/immediately-invoked-function-expression/

  var canvas, context;
  var data = [];
  // 1 Kachel soll eine breite von 120px haben, zwischen den Kacheln ein Abstand von 20px und 3 Felder pro Reihe.
  var width = 120;
  var padding = 20;
  var fields = 3;
  var player, ai, index, isPlayer, aiMoved, winner, winnerMessage;

  window.onload = function main() {
    canvas = document.createElement("canvas");
    canvas.width = canvas.height = fields * width + padding; // 3 Felder sollen nebeneinander passen, mit einem Padding von 20 px.

    context = canvas.getContext("2d");

    document.body.appendChild(canvas);

    canvas.addEventListener("mousedown", mouseDown);

    init();
    tic();
  };

  // Intialisierung des Spielfeldes
  function init() {
  // 9 Kacheln, jeweils 120 px breit und hoch und 20 px Padding.
        for (var i = 0; i < 9; i++){
          var x = (i % fields)*width + padding;
          var y = Math.floor(i/fields)*width + padding;
          data.push(new Tile(x, y));
        }


    player = Tile.CROSS;

    // Initialisierung kann oben stattfinden
    isPlayer = player === Tile.CROSS;
    aiMoved = false;
    winner = false;
    winnerMessage = false;
    hastic = false;
    hasWinner = false;

    ai = new computerPlayer(data);
    ai.setSeed(player === Tile.CIRCLE ? Tile.CROSS : Tile.CIRCLE);

  }
  function tic() {
    if(!winnerMessage) window.requestAnimationFrame(tic);
    update();
    render();
  }

  function update() {
    if (winnerMessage){
      return console.log(winnerMessage);
    } else {

    for (var i = data.length; i--;) {
      data[i].update();
    }

      if (!aiMoved && !isPlayer) {
          var m = ai.move();
            if (m === -1) {
              winner = true;
            } else {
              data[m].clicked(ai.getSeed());
            }
            isPlayer = true;
    }

      if (winner && !aiMoved) {
          if (winner === true) {
            winnerMessage = "Unentschieden :-/";
          } else if (winner === Tile.CIRCLE) {
            winnerMessage = "KREIS gewinnt!";
          } else {
            winnerMessage = "KREUZ gewinnt!";
          }
      }

      aiMoved = true;
     }
      if (aiMoved) {
        winner = ai.hasWinner();
      }
      aiMoved = false;
  };

  function render() {
    for (var i = data.length; i--;) {
      data[i].draw(context);
    }

  }

  function mouseDown(evt) {
    if (!isPlayer) return;
    var el = evt.target;

    var px = evt.clientX - el.offsetLeft;
    var py = evt.clientY - el.offsetTop;

    if (px % width >= padding && py % width >= padding) {
      var index = Math.floor(px/width);
      index += Math.floor(py/width)*fields;

      if (data[index].hasData()) {
        return;
      }
      data[index].clicked(player);
      //Wenn der Spieler geklickt hat, wechseln wir von CIRCLE auf CROSS.
      isPlayer = false;
    }
  }

  function Tile (x,y) {

    var x = x;
    var y = y;

    var tile = Tile.BLANK;

    if (tile == null) {
       var _c = document.createElement("canvas");
       _c.width = _c.height = 100;
       var _context = _c.getContext("2d");

       _context.fillStyle = "orange";
       _context.lineWidth = 6;

       _context.fillRect(0, 0, 100, 100);
       Tile.BLANK = new Image();
       Tile.BLANK.src = _c.toDataURL();

       _context.fillRect(0, 0, 100, 100);
       _context.beginPath();
       _context.arc(50,50, 30, 0, 2*Math.PI);
       _context.stroke();
       Tile.CIRCLE = new Image();
       Tile.CIRCLE.src = _c.toDataURL();

       _context.fillRect(0, 0, 100, 100);
       _context.beginPath();
       _context.moveTo(20, 20);
       _context.lineTo(80, 80);
       _context.moveTo(80, 20);
       _context.lineTo(20, 80);
       _context.stroke();
       Tile.CROSS = new Image();
       Tile.CROSS.src = _c.toDataURL();

       tile = Tile.BLANK;
    }

    // HIER: this = Tile

    this.equals = function(_tile){
      return tile === _tile;
    };

    this.hasData = function() {
      return tile !== Tile.BLANK;
    };

    this.set = function(next){
      tile = next;
    };

    this.clicked = function(next) {
      tile = next;
    };

    // Weg damit
    this.update = function() {
    };

    this.draw = function(context) {
          context.drawImage(tile, x, y)
      }
  }



  // Inspired by http://www3.ntu.edu.sg/home/ehchua/programming/java/JavaGame_TicTacToe_AI.html
  function computerPlayer(data) {
    var data = data, seed, oppSeed;

    this.setSeed= function(_seed){
      seed = _seed;
      oppSeed = _seed === Tile.CIRCLE ? Tile.CROSS : Tile.CIRCLE;
    };

    this.getSeed = function(){
      return seed;
    };

    this.move = function(){
      return minimax(2, seed)[1];
    };

    function minimax(depth, player){
      var nextMoves = getValidMoves();

      var best = (player === seed) ? -1e100 : 1e100,
      current,
      bestindex = -1;

      if (nextMoves.length === 0 || depth === 0) {
        best = evaluate();
      } else {
        for(var i = nextMoves.length;i--;){
          var m = nextMoves[i];
          data[m].set(player);

          if (player === seed) {
            current = minimax(depth-1, oppSeed)[0];
            if (current > best) {
              best = current;
              bestindex = m;
            }
          } else {
            current = minimax(depth-1, seed)[0];
            if (current < best) {
              best = current;
              bestindex = m;
            }
          }

          data[m].set(Tile.BLANK);
        }
      }

      return [best, bestindex];
    }

    function getValidMoves(){
      var nextMovesArray = [];
      if (hasWon(seed) || hasWon(oppSeed)) {
        return nextMovesArray;
      }
      for (var i = data.length; i--;) {
        if (!data[i].hasData()) {
          nextMovesArray.push(i);
        }
      }
      return nextMovesArray;
    }

    function evaluate(){
      var score = 0;
      //Alle Linien die möchlich sind, evaluieren.
      // DRY
       var winningLines = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8],
          [0, 3, 6],
          [1, 4, 7],
          [2, 5, 8],
          [0, 4, 8],
          [2, 4, 6]
       ]

       winningLines.forEach(function(line) {
        score += evaluateLine.apply(null, line);
       })
      return score;
    }

    function evaluateLine(index1, index2, index3){
      var score = 0;

      if (data[index1].equals(seed)){
          score = 1;
      } else if (data[index1].equals(oppSeed)) {
          score = -1;
      }

      if (data[index2].equals(seed)){
          if (score === 1) {
            score = 10;
          } else if (score === -1) {
            return 0;
          } else {
            score = 1;
          }
      } else if (data[index2].equals(oppSeed)) {
        if (score === -1) {
          score = -10;
        } else if (score === 1) {
          return 0;
        } else {
          score = -1;
      }
     }

      if (data[index3].equals(seed)){
          if(score > 0) {
            score *= 10;
          } else if (score < 0) {
            return 0;
          } else {
            score = 1;
          }
      } else if (data[index3].equals(oppSeed)) {
        if(score < 0) {
          score *= 10;
        } else if (score > 0) {
          return 0;
        } else {
          score = -1;
        }
      }

      return score;

  }
    var winningPatterns = (function() {
      //Stichwort: Bitwise Operators: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
      var wp = ["111000000", "000111000", "000000111",
                "100100100", "010010010", "001001001",
                "100010001","001010100"],
          r = new Array(wp.length);
          for (var i = wp.length;i--;) {
            r[i] = parseInt(wp[i], 2); //base2
          }
          return r;
    })();


    function hasWon(player){
      var pattern = 0; // 000
      for (var i = data.length;i--;) {
        if (data[i].equals(player)) {
          pattern |= (1 << i); // 000 |= 001 => 001  und 001 << 2 => 100 (Bitshift um 2 Stellen)
        }
      }
      for (var i = winningPatterns.length;i--;) {
        var wp = winningPatterns[i];
        if ((pattern & wp) === wp) return true;
      }
      return false;
    };

    this.hasWinner = function() {
      if (hasWon(seed)) {
        return seed;
      } if (hasWon(oppSeed)) {
        return oppSeed;
      }
      return false;
    }
  }
}())
