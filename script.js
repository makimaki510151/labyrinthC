// JavaScript
const setupSection = document.getElementById('setup-section');
const paletteSection = document.getElementById('palette-section');
const gridSizeInput = document.getElementById('grid-size');
const generateBtn = document.getElementById('generate-btn');
const gridContainer = document.getElementById('grid-container');
const colorButtons = document.querySelectorAll('.color-button');
const outputBtn = document.getElementById('output-btn');
const resetBtn = document.getElementById('reset-btn');
const undoBtn = document.getElementById('undo-btn');
const mazeBtn = document.getElementById('maze-btn');
const outputArea = document.getElementById('output-area');
const dotOutput = document.getElementById('dot-output');

let gridSize = 0;
let selectedColor = 'black'; // 初期選択色
let isDrawing = false; // マウスボタンが押されている状態を管理

// Undo機能のための変数
const history = []; // 履歴スタック
const maxHistory = 30; // 保持する履歴の最大数

// ------------------------------------------
// Undo履歴管理機能
// ------------------------------------------

/**
 * 現在のグリッドの状態（各セルの色クラス名）を取得し、履歴に保存する
 */
function recordHistory() {
    const cells = gridContainer.querySelectorAll('.cell');
    const state = Array.from(cells).map(cell => {
        const colorClass = Array.from(cell.classList).find(c => c.startsWith('color-'));
        return colorClass ? colorClass.replace('color-', '') : 'black';
    });

    // 履歴の上限チェック
    if (history.length >= maxHistory) {
        history.shift(); // 最も古い履歴を削除
    }

    history.push(state);
    updateUndoButtonState();
}

/**
 * 履歴を元にグリッドの状態を復元する
 */
function undo() {
    if (history.length <= 1) { 
        return;
    }

    history.pop(); 
    
    const previousState = history[history.length - 1];
    const cells = gridContainer.querySelectorAll('.cell');

    cells.forEach((cell, index) => {
        const newColor = previousState[index];
        cell.classList.remove('color-blue', 'color-red', 'color-white', 'color-black');
        cell.classList.add(`color-${newColor}`);
    });

    updateUndoButtonState();
}

/**
 * Undoボタンの有効/無効状態を更新
 */
function updateUndoButtonState() {
    undoBtn.disabled = history.length <= 1;
}

/**
 * 特定のセルに色を適用するヘルパー関数 (Undo対象外の強制適用)
 * @param {HTMLElement} cell 
 * @param {string} color 'black', 'white', 'red', 'blue'
 */
function forceApplyColor(cell, color) {
    cell.classList.remove('color-blue', 'color-red', 'color-white', 'color-black');
    cell.classList.add(`color-${color}`);
}

// ------------------------------------------
// 迷路生成機能 (穴掘り法)
// ------------------------------------------

function generateMaze() {
    if (gridSize < 3) {
        alert('迷路を生成するには、マス目サイズを3以上にする必要があります。');
        return;
    }
    
    // 迷路生成前の状態をUndo履歴に記録
    recordHistory(); 
    
    const cells = gridContainer.querySelectorAll('.cell');
    
    // 1. グリッド全体を一旦「壁」(黒) で埋める
    cells.forEach(cell => {
        forceApplyColor(cell, 'black');
    });

    // 2. 迷路の生成を開始 (穴掘り法)
    const maxRow = gridSize - 1;
    const maxCol = gridSize - 1;

    // 奇数の座標(1, 1)からスタート
    let startRow = 1;
    let startCol = 1;

    const visited = new Set();
    const stack = [];

    if (startRow < maxRow && startCol < maxCol) {
        const startIndex = startRow * gridSize + startCol;
        forceApplyColor(cells[startIndex], 'white'); 
        visited.add(startIndex);
        stack.push({ r: startRow, c: startCol });
    } else {
        return;
    }

    const directions = [
        { dr: 0, dc: 2 }, // 右
        { dr: 0, dc: -2 }, // 左
        { dr: 2, dc: 0 }, // 下
        { dr: -2, dc: 0 }  // 上
    ];

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        let unvisitedNeighbors = [];

        directions.forEach(dir => {
            const nextR = current.r + dir.dr;
            const nextC = current.c + dir.dc;
            const neighborIndex = nextR * gridSize + nextC;

            if (nextR >= 1 && nextR < maxRow && nextC >= 1 && nextC < maxCol && !visited.has(neighborIndex)) {
                unvisitedNeighbors.push({ r: nextR, c: nextC, dir: dir });
            }
        });

        if (unvisitedNeighbors.length > 0) {
            const randomNeighbor = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
            
            const wallR = current.r + randomNeighbor.dir.dr / 2;
            const wallC = current.c + randomNeighbor.dir.dc / 2;
            const wallIndex = wallR * gridSize + wallC;

            forceApplyColor(cells[wallIndex], 'white'); 

            const nextIndex = randomNeighbor.r * gridSize + randomNeighbor.c;
            forceApplyColor(cells[nextIndex], 'white');
            visited.add(nextIndex);
            stack.push({ r: randomNeighbor.r, c: randomNeighbor.c });

        } else {
            stack.pop();
        }
    }
    
    // 3. 外側1マスを黒で統一 (外枠を確実に壁にする)
    for (let i = 0; i < gridSize; i++) {
        // 上端
        forceApplyColor(cells[i], 'black');
        // 下端
        forceApplyColor(cells[(gridSize - 1) * gridSize + i], 'black');
        // 左端
        forceApplyColor(cells[i * gridSize], 'black');
        // 右端
        forceApplyColor(cells[i * gridSize + (gridSize - 1)], 'black');
    }
}


// ------------------------------------------
// 塗りつぶし実行関数
// ------------------------------------------

function applyColor(cell) {
    const currentColor = Array.from(cell.classList).find(c => c.startsWith('color-'))?.replace('color-', '');

    if (currentColor === selectedColor) {
        return false; 
    }

    cell.classList.remove('color-blue', 'color-red', 'color-white', 'color-black');
    cell.classList.add(`color-${selectedColor}`);
    
    return true; 
}

// ------------------------------------------
// イベントハンドラー (長押し対応)
// ------------------------------------------

function handleCellInteraction(event) {
    const isLeftClickOrTouch = (event.type === 'mousedown' && event.button === 0) || 
                               (event.type === 'touchstart');

    if (isLeftClickOrTouch) {
        if (!isDrawing) {
            recordHistory(); 
        }
        isDrawing = true;

        applyColor(event.currentTarget);
    }
    else if (event.type === 'mouseover' || event.type === 'touchmove') {
        if (isDrawing && event.currentTarget.classList.contains('cell')) {
            applyColor(event.currentTarget);
        }
    }
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
    }
}

// ------------------------------------------
// マス目生成機能
// ------------------------------------------

function createGrid() {
    gridSize = parseInt(gridSizeInput.value, 10);
    if (isNaN(gridSize) || gridSize < 1) {
        alert('有効なサイズ（1以上の数値）を入力してください。');
        return;
    }

    setupSection.classList.add('hidden');
    paletteSection.classList.remove('hidden');
    outputArea.classList.add('hidden'); 

    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;

    history.length = 0; 
    isDrawing = false;

    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell', 'color-black');
        cell.dataset.index = i;

        cell.addEventListener('mousedown', handleCellInteraction);
        cell.addEventListener('mouseover', handleCellInteraction);

        cell.addEventListener('touchstart', handleCellInteraction);
        cell.addEventListener('touchmove', handleCellInteraction);

        gridContainer.appendChild(cell);
    }
    
    recordHistory(); 
}

// ------------------------------------------
// カラーパレットと塗りつぶし機能 ★修正: この関数は前回から変更なし★
// ------------------------------------------

function handleColorSelection(event) {
    colorButtons.forEach(btn => btn.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    selectedColor = event.currentTarget.dataset.color;
}

// ------------------------------------------
// 出力表示とダウンロード機能 (前回から変更なし)
// ------------------------------------------

function outputDotPattern() {
    outputArea.classList.remove('hidden');
    dotOutput.innerHTML = '';
    const displayDotSize = 1; 
    dotOutput.style.gridTemplateColumns = `repeat(${gridSize}, ${displayDotSize}px)`;
    dotOutput.style.width = `${gridSize * displayDotSize}px`;
    dotOutput.style.height = `${gridSize * displayDotSize}px`;

    const cells = gridContainer.querySelectorAll('.cell');
    cells.forEach(cell => {
        const dot = document.createElement('div');
        dot.classList.add('dot-cell');
        dot.style.width = `${displayDotSize}px`;
        dot.style.height = `${displayDotSize}px`;

        const colorClass = Array.from(cell.classList).find(c => c.startsWith('color-'));
        if (colorClass) {
            const color = colorClass.replace('color-', '');
            dot.style.backgroundColor = color;
        }

        dotOutput.appendChild(dot);
    });
    downloadOutput();
}

function downloadOutput() {
    const canvas = document.createElement('canvas');
    const downloadDotSize = 1;
    canvas.width = gridSize * downloadDotSize;
    canvas.height = gridSize * downloadDotSize;
    const ctx = canvas.getContext('2d');

    const cells = gridContainer.querySelectorAll('.cell');

    cells.forEach((cell, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        const colorClass = Array.from(cell.classList).find(c => c.startsWith('color-'));
        let color = 'black';
        if (colorClass) {
            color = colorClass.replace('color-', '');
        }

        ctx.fillStyle = color;
        ctx.fillRect(col * downloadDotSize, row * downloadDotSize, downloadDotSize, downloadDotSize);
    });

    const link = document.createElement('a');
    link.download = `dot_pattern_${gridSize}x${gridSize}_${new Date().toISOString().slice(0, 10)}.png`;
    link.style.display = 'none';

    canvas.toBlob(function (blob) {
        if (blob) {
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } else {
            console.error('画像の生成に失敗しました。');
        }
    }, 'image/png');
}

function resetApplication() {
    paletteSection.classList.add('hidden');
    outputArea.classList.add('hidden');
    setupSection.classList.remove('hidden');
    gridContainer.innerHTML = ''; 
    dotOutput.innerHTML = ''; 
    selectedColor = 'black';
    isDrawing = false; 

    history.length = 0; 
    updateUndoButtonState();

    colorButtons.forEach(btn => btn.classList.remove('selected'));
    document.querySelector('.color-button.color-black').classList.add('selected');
}

// ------------------------------------------
// イベントリスナー
// ------------------------------------------

generateBtn.addEventListener('click', createGrid);
outputBtn.addEventListener('click', outputDotPattern);
resetBtn.addEventListener('click', resetApplication);
undoBtn.addEventListener('click', undo); 
mazeBtn.addEventListener('click', generateMaze); 

// ★ここが抜けていました！カラーボタンにイベントリスナーを設定★
colorButtons.forEach(button => {
    button.addEventListener('click', handleColorSelection);
});

document.addEventListener('mouseup', stopDrawing);
document.addEventListener('touchend', stopDrawing);
document.addEventListener('touchcancel', stopDrawing);

// Ctrl+Z (または Cmd+Z) のショートカットに対応
document.addEventListener('keydown', (event) => {
    const isControlOrCommand = event.ctrlKey || event.metaKey;

    if (isControlOrCommand && event.key.toLowerCase() === 'z') {
        event.preventDefault(); 
        undo();
    }
});