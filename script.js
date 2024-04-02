const canvas = document.getElementById("tetris"),
      context = canvas.getContext("2d");

context.scale(20, 20); // fais que chaque unité dans le dessin sera de 20 pixels

// gére les lignes complète et le score
function arenaSweep(){
    let rowCount = 1;
    outer: for(let y = arena.length - 1; y > 0; --y){
        for(let x = 0; x < arena[y].length; ++x){
            if(arena[y][x] === 0){
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0); // [0] récupére le 1er tab de arena.splice(y, 1)
        arena.unshift(row);
        ++y;
        player.score += rowCount *10;
        rowCount *= 2;
    }
}

// vérifie si la pièce contrôlée par le joueur entre en collision avec des cellules déjà occupées dans l'arène de jeu.
function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for(let y = 0; y < m.length; ++y) {
        for(let x = 0; x < m[y].length; ++x){
            if(m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0){ // arena[y + o.y] verif si la lig est définit cad !(non nulle et non undefined)
                return true; 
            }
        }
    }
    return false;
}

function createMatrix(w, h){
    const matrix = [];
    while(h--){
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type){
    if(type === "I"){
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ];
    }
    else if(type === "L"){
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 0]
        ];
    } else if(type === "J"){
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0]
        ];
    } else if(type === "O"){
        return [
            [4, 4],
            [4, 4]
        ];
    } else if(type === "Z"){
        return [
            [5, 5, 0],
            [0, 5, 5], 
            [0, 0, 0]
        ];
    } else if(type === "S"){
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0]
        ];
    } else if(type === "T"){
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0]
        ];
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {    // row -> ligne, y->indice
        row.forEach((value, x) => { // value->element, x->indice
            if(value !== 0){
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1); // dessiner un rect de w=h=1;
            }
        });
    });
}

function draw(){
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.clientWidth, canvas.height); // remplie l'élément canvas
    drawMatrix(arena, {x: 0, y: 0}); // dessine à partir du coin > gauche du canvas
    drawMatrix(player.matrix, player.pos);
}

// permet de "figer" les blocs du joueur dans la matrice de l'arène lorsqu'il 
// atteint le bas de l'écran ou qu'il entre en collision avec d'autres blocs.
function merge(arena, player){
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value !== 0){
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir){
    for(let y = 0; y < matrix.length; ++y){
        for(let x = 0; x < y; ++x){
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]]; // tanspose la matrice (lig <-> col)
        }
    }
    if(dir > 0){
        matrix.forEach((row) => row.reverse()); // dans le sens des aig. d'une montre
    } else{ 
        matrix.reverse();   // dans le sens inverse des aiguilles d'une montre
    }
}

//  gère le mouvement automatique vers le bas du joueur dans le jeu Tetris
function playerDrop(){
    player.pos.y++; // ait descendre d'une ligne vers le bas.
    if(collide(arena, player)){ // si collision 
        player.pos.y--; // Annule le mouvement vers le bas, ramenant le joueur à sa position précédente.
        merge(arena, player); // fixe la pièce du joueur dans l'arène.
        playerReset(); // réinitialise la position et la matrice du joueur pour une nouvelle pièce.
        arenaSweep();  // Vérifie s'il y a des lignes complètes dans l'arène et les supprime.
        updateScore();
    }
    dropCounter = 0;
}

// gère le déplacement latéral du joueur dans le jeu Tetris
function playerMove(offset){
    player.pos.x += offset; // Inc ou Dec la pos latterale
    if(collide(arena, player)){ // si collision avec quelque chose dans l'arène.
        player.pos.x -= offset; // annule le déplacement latéral en ramenant le joueur à sa position précédente.
    }
}

// génère une nouvelle pièce de Tetris, place le joueur en haut de l'arène avec la pièce centrée horizontalement, ...
function playerReset(){
    const pieces = "TJLOSZI";
    player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
    player.pos.y = 0;
    player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0); // entre horizontalement la nouvelle pièce dans l'arène
    if(collide(arena, player)){ // collision entre la nouvelle position de la pièce et les pièces déjà présentes dans l'arène.
        arena.forEach((row) => row.fill(0)); // remplit toutes les lignes de l'arène avec des zéros, effaçant ainsi toutes les pièces présentes.
        player.score = 0;
        updateScore(); // met à jour l'affichage du score.
    }
}

// tente de faire pivoter la pièce Tetris du joueur tout en évitant les collisions avec l'arène.
function playerRotate(dir){
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while(collide(arena, player)){
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1)); // change le signe de l'offset
        if(offset > player.matrix[0].length){ // si oui, cela signifie que nous avons essayé toutes les positions possibles pour éviter la collision.
            rotate(player.matrix, -dir); // annule la rotation précédente.
            player.pos.x = pos;
            return;
        }
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// met à jour le jeu en fonction du temps écoulé depuis la dernière trame, fait descendre la pièce Tetris à intervalles réguliers,
function update(time = 0){
    const deltaTime = time - lastTime;
    dropCounter += deltaTime;
    if(dropCounter > dropInterval){
        playerDrop();
    }
    lastTime = time;
    draw();
    requestAnimationFrame(update);
}

function updateScore(){
    document.getElementById("score").innerText = "Score : " + player.score;
}

document.addEventListener("keydown", (event) => {
    if(event.keyCode === 37){           // <-
        playerMove(-1);
    } else if(event.keyCode === 39) {   // ->
        playerMove(1);
    } else if(event.keyCode === 40){    // flèche vers la bas
        playerDrop();
    } else if(event.keyCode === 81){    // Q
        playerRotate(-1);
    } else if(event.keyCode === 87){    // W
        playerRotate(1);
    }
});

const colors = [
    null,
    "#ff0d72",
    "#0dc2ff",
    "#0dff72",
    "#f538ff",
    "#ff8e0d",
    "#ffe138",
    "#3877ff"
];

const arena = createMatrix(12, 20);
const player = {
    pos:  {x: 0, y: 0}, 
    matrix: null,
    score: 0,
};

playerReset();
updateScore();
update();


/* NOTES : 
- La balise outer (on aurait pu donner autre nom): dans le code joue le rôle d'une étiquette.
    Dans notre cas, continue outer; est utilisée pour sauter à l'itération suivante 
    de la boucle extérieure à partir de l'intérieur de la boucle intérieure

- shift() : retire le premier élément d'un tableau et renvoie cet élément
    let fruits = ["pomme", "orange", "banane"];
    let premierFruit = fruits.shift();

- unshift(...elements) : ajoute un ou plusieurs éléments au début d'un tableau 
    et renvoie la nouvelle longueur du tableau.
    Ex :
    let fruits = ["orange", "banane"];
    let nouvelleLongueur = fruits.unshift("pomme", "kiwi");

- tab.splice(index, nb_el);
    arena.splice(y, 1) : retire et renvoie un élément à l'index y du tableau arena.

- dans "arena.splice(y, 1)[0].fill(0);" : [0] fais référence à la ligne renvoyer 
    par "arena.splice(...)"

    const row = arena.splice(y, 1)[0].fill(0); // [0] récupére le 1er tab de arena.splice(y, 1)

- context.fillRect(x + offset.x, y + offset.y, 1, 1); : dessiner un rect de w=h=1;

- context.scale(20, 20) ajuste l'échelle du contexte 2D. 
    Cela signifie que chaque unité dans le dessin sera de 20 pixels.

- Dans l'utilisation normale de "requestAnimationFrame", le navigateur fournit la 
    valeur actuelle du temps lorsqu'il appelle la fonction, et cette valeur n'est 
    généralement pas égale à 0 et time != 0

- "requestAnimationFrame" est une fonction JavaScript intégrée qui est couramment 
    utilisée pour créer des animations en synchronisation avec le taux de rafraîchissement 
    du navigateur
    
    L'utilisation de requestAnimationFrame est préférable à des méthodes telles que 
    "setInterval" pour les animations, car elle est optimisée pour fonctionner en 
    harmonie avec le taux de rafraîchissement du navigateur, ce qui contribue à une 
    expérience utilisateur plus fluide et à une utilisation plus efficace des ressources..     .

- En utilisant (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0, vous vous 
    assurez que la première partie de l'expression est vraie (c'est-à-dire que arena[y + o.y] 
    est défini et non nul) avant de tenter d'accéder à arena[y + o.y][x + o.x]. 
    
    Cela évite les erreurs liées à l'accès à des propriétés d'objets undefined.




*/